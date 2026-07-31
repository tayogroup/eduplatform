-- READ-ONLY. Validates the newly-created "Ehel Skills School" consumer
-- against the established pattern (K-12 / Languages): institution_type,
-- teaching_method, operator_type, hosted website_mode, domain pair
-- (public isprimary=1, app isprimary=0), a real linked workspace, the shared
-- admin (userid 1214), and whether it's been linked into the "Ehel Academy
-- Schools" org_group (groupid=3) yet.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. The consumer record itself.
SELECT c.id AS consumerid, c.slug, c.name, c.consumer_type, c.institution_type,
       c.faith_subcategory, c.teaching_method, c.operator_type,
       c.website_mode, c.externalwebsiteurl, c.domainmanagement, c.portallabel,
       c.brandingsource, c.intakelocation, c.integrationmethod,
       c.defaultpublicpath, c.defaultdashboardpath,
       c.primaryworkspaceid, c.owneruserid, c.supportemail, c.logourl,
       c.status, c.themejson, c.copyjson
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer c
WHERE c.slug = 'ehel-skills';

-- 2. Its domain pair -- expect exactly 2 active rows: public (isprimary=1)
--    skills.ehelacademy.org, app (isprimary=0) app.skills.ehelacademy.org.
SELECT d.consumerid, d.domain, d.domain_type, d.isprimary, d.status
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer_domain d
JOIN ehelacad_quraantest.mdlgx_local_prequran_consumer c ON c.id = d.consumerid
WHERE c.slug = 'ehel-skills'
ORDER BY d.domain_type;

-- 3. Its linked workspace -- must exist, status active, ownerid = 1214 to
--    match the other two schools' admin.
SELECT w.id AS workspaceid, w.name, w.slug, w.workspace_type, w.ownerid,
       w.status, w.plan_code, w.student_limit, w.teacher_limit,
       w.session_limit, w.storage_limit_mb, w.settingsjson
FROM ehelacad_quraantest.mdlgx_local_prequran_workspace w
WHERE w.id = (SELECT primaryworkspaceid FROM ehelacad_quraantest.mdlgx_local_prequran_consumer WHERE slug = 'ehel-skills');

-- 4. Workspace membership -- the admin (1214) should hold owner + admin
--    rows on this workspace, same as K-12 / Languages.
SELECT wm.workspaceid, wm.userid, wm.workspace_role, wm.status
FROM ehelacad_quraantest.mdlgx_local_prequran_workspace_member wm
WHERE wm.workspaceid = (SELECT primaryworkspaceid FROM ehelacad_quraantest.mdlgx_local_prequran_consumer WHERE slug = 'ehel-skills')
ORDER BY wm.workspace_role;

-- 5. Is it linked into the "Ehel Academy Schools" org_group (groupid=3) yet?
--    Empty result = not linked yet (expected, since I haven't sent you the
--    INSERT for it).
SELECT gm.id AS memberrowid, gm.groupid, gm.memberid AS workspaceid,
       gm.relationship_type, gm.status AS member_status
FROM ehelacad_quraantest.mdlgx_local_prequran_org_group_member gm
WHERE gm.groupid = 3
  AND gm.memberid = (SELECT primaryworkspaceid FROM ehelacad_quraantest.mdlgx_local_prequran_consumer WHERE slug = 'ehel-skills');

-- 6. Slug/domain collision sanity check -- should return only the one row
--    from query 1 above; more than one means a duplicate slug slipped in.
SELECT id, slug, name, status
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer
WHERE slug = 'ehel-skills';
