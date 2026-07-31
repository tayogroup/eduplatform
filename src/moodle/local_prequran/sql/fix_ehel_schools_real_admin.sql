-- Reassigns real ownership/administration of all three Ehel schools (Ehel
-- Languages School id=22, Ehel K-12 School id=23, Ehel Skills School id=24)
-- to the real admin account (userid=2, username=admin,
-- admin@ehelacademy.work), replacing two different wrong values found this
-- session:
--   - userid 1214 ("Hana Pilot (G1)") -- a DELETED pilot/test student
--     account, wrongly left as workspace ownerid + workspace_member
--     owner/admin on Languages and K-12 (pre-existing, before this session)
--     and copied onto Skills by an earlier fix in this session that
--     (reasonably at the time) matched what looked like an established
--     pattern.
--   - userid 1 -- a separate wrong value found on Ehel Skills School's
--     CONSUMER record specifically (local_prequran_consumer.owneruserid),
--     never corrected by the earlier workspace-level fix, which only
--     touched local_prequran_workspace/workspace_member, not the consumer
--     table's own owneruserid column.
-- This corrects consumer.owneruserid, workspace.ownerid, and
-- workspace_member rows for all three schools in one pass, deactivating
-- (not deleting) any stale owner/admin rows under either wrong userid.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- Sanity check: confirm userid 2 is real, active, not deleted/suspended,
-- before relying on it below.
SELECT id, username, firstname, lastname, email, suspended, deleted
FROM ehelacad_quraantest.mdlgx_user
WHERE id = 2;

UPDATE ehelacad_quraantest.mdlgx_local_prequran_consumer
SET owneruserid = 2, timemodified = UNIX_TIMESTAMP()
WHERE id IN (7, 8, 9);

UPDATE ehelacad_quraantest.mdlgx_local_prequran_workspace
SET ownerid = 2, timemodified = UNIX_TIMESTAMP()
WHERE id IN (22, 23, 24);

UPDATE ehelacad_quraantest.mdlgx_local_prequran_workspace_member
SET status = 'inactive', timemodified = UNIX_TIMESTAMP()
WHERE workspaceid IN (22, 23, 24)
  AND userid IN (1, 1214)
  AND status = 'active';

INSERT INTO ehelacad_quraantest.mdlgx_local_prequran_workspace_member
    (workspaceid, userid, workspace_role, status, notes, createdby, timecreated, timemodified)
VALUES
    (22, 2, 'owner', 'active', 'Corrected from deleted pilot account 1214.', 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    (22, 2, 'admin', 'active', 'Corrected from deleted pilot account 1214.', 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    (23, 2, 'owner', 'active', 'Corrected from deleted pilot account 1214.', 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    (23, 2, 'admin', 'active', 'Corrected from deleted pilot account 1214.', 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    (24, 2, 'owner', 'active', 'Corrected from deleted pilot account 1214.', 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    (24, 2, 'admin', 'active', 'Corrected from deleted pilot account 1214.', 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE status = 'active', timemodified = UNIX_TIMESTAMP();

-- Verify: all three consumers now owned by 2.
SELECT id AS consumerid, slug, name, owneruserid
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer
WHERE id IN (7, 8, 9)
ORDER BY id;

-- Verify: all three workspaces now owned by 2, and membership shows 2 as
-- active owner+admin with any old 1/1214 rows now inactive.
SELECT w.id AS workspaceid, w.name, w.ownerid,
       wm.userid, wm.workspace_role, wm.status
FROM ehelacad_quraantest.mdlgx_local_prequran_workspace w
JOIN ehelacad_quraantest.mdlgx_local_prequran_workspace_member wm ON wm.workspaceid = w.id
WHERE w.id IN (22, 23, 24)
ORDER BY w.id, wm.userid, wm.workspace_role;
