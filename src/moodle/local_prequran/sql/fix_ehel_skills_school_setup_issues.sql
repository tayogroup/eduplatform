-- Fixes two deviations found in the "Ehel Skills School" consumer (id=9,
-- workspace 24) versus the established K-12/Languages pattern:
--
-- 1. defaultpublicpath was left as '/local/hubredirect/platform_landing.php'
--    (the generic EduPlatform-wide landing page) instead of
--    '/local/hubredirect/consumer_landing.php' (the branded per-institution
--    landing page K-12 and Languages both use). Left as-is, visitors to
--    skills.ehelacademy.org would land on generic platform branding instead
--    of "Ehel Skills School" branding.
--
-- 2. The workspace's owner/admin is Moodle user id 1, not user id 1214 (the
--    shared admin who owns the K-12 and Languages workspaces). This means
--    the "Existing first admin" field in the wizard resolved to the wrong
--    account -- 1 looks like a leftover/bootstrap account, not the intended
--    school operator. This deactivates the id=1 owner/admin rows (kept, not
--    deleted, in case that was actually intentional) and adds 1214 as both
--    owner and admin, matching the other two schools.
--
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different. Review the two SELECTs at the bottom
-- before assuming this ran cleanly.

UPDATE ehelacad_quraantest.mdlgx_local_prequran_consumer
SET defaultpublicpath = '/local/hubredirect/consumer_landing.php',
    timemodified = UNIX_TIMESTAMP()
WHERE id = 9
  AND slug = 'ehel-skills';

UPDATE ehelacad_quraantest.mdlgx_local_prequran_workspace
SET ownerid = 1214,
    timemodified = UNIX_TIMESTAMP()
WHERE id = 24
  AND slug = 'ehel-skills';

UPDATE ehelacad_quraantest.mdlgx_local_prequran_workspace_member
SET status = 'inactive',
    timemodified = UNIX_TIMESTAMP()
WHERE workspaceid = 24
  AND userid = 1;

INSERT INTO ehelacad_quraantest.mdlgx_local_prequran_workspace_member
    (workspaceid, userid, workspace_role, status, notes, createdby, timecreated, timemodified)
VALUES
    (24, 1214, 'owner', 'active', 'Corrected to match ehel-languages/ehel-k12 admin.', 1214, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
    (24, 1214, 'admin', 'active', 'Corrected to match ehel-languages/ehel-k12 admin.', 1214, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE status = 'active', timemodified = UNIX_TIMESTAMP();

-- Verify: consumer route corrected.
SELECT id, slug, defaultpublicpath FROM ehelacad_quraantest.mdlgx_local_prequran_consumer WHERE id = 9;

-- Verify: workspace owner corrected and membership rows now show 1214
-- active as owner+admin, with any old userid=1 rows now inactive.
SELECT w.id AS workspaceid, w.ownerid,
       wm.userid, wm.workspace_role, wm.status
FROM ehelacad_quraantest.mdlgx_local_prequran_workspace w
JOIN ehelacad_quraantest.mdlgx_local_prequran_workspace_member wm ON wm.workspaceid = w.id
WHERE w.id = 24
ORDER BY wm.userid, wm.workspace_role;
