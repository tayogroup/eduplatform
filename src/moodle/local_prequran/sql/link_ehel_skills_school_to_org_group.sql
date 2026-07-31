-- Links Ehel Skills School's workspace (id=24) into the "Ehel Academy
-- Schools" org_group (groupid=3, parentconsumerid=6 Ehel Academy), the same
-- way Ehel Languages School (workspace 22) and Ehel K-12 School (workspace
-- 23) are already linked. This is the last step for
-- pqh_org_group_child_schools() to pick it up, which is what makes it show
-- up in the "Which school is this for?" radio picker on
-- app.ehelacademy.org/local/hubredirect/public_intake.php.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

INSERT INTO ehelacad_quraantest.mdlgx_local_prequran_org_group_member
    (groupid, member_type, memberid, relationship_type, group_role, access_scope, inherit_sensitive_access, status, notes, createdby, timecreated, timemodified)
VALUES
    (3, 'workspace', 24, 'owned_branch', 'member', '', 0, 'active', 'Ehel Skills School.', 1214, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- Verify: should now show 3 active members (Languages, K-12, Skills).
SELECT gm.id AS memberrowid, gm.groupid, gm.memberid AS workspaceid,
       gm.relationship_type, gm.status AS member_status,
       c.slug AS school_slug, c.name AS school_name
FROM ehelacad_quraantest.mdlgx_local_prequran_org_group_member gm
LEFT JOIN ehelacad_quraantest.mdlgx_local_prequran_consumer c ON c.primaryworkspaceid = gm.memberid
WHERE gm.groupid = 3
ORDER BY gm.id;
