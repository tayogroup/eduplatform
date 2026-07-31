-- Links "Ehel Adult School", "Ehel Skills School", and "Ehel Tech School"
-- into the existing "Ehel Academy Schools" org_group (groupid = 3, per
-- check_ehel_schools_current_state.sql / check_ehel_academy_child_schools_link.sql),
-- the same way Ehel K-12 (workspaceid 23) and Ehel Languages (workspaceid 22)
-- are already linked. Once linked, pqh_org_group_child_schools() will surface
-- each school in the "Which school is this for?" picker on public_intake.php
-- on the Ehel Academy parent domain, and each becomes eligible for its own
-- role-portal subdomains (see add_ehel_k12_role_portal_domains.sql /
-- add_ehel_languages_role_portal_domains.sql for that separate, later step).
--
-- IMPORTANT -- run PART 1 first and read the results before running PART 2.
-- The comment in check_ehel_schools_current_state.sql notes these three
-- schools may or may not have been created yet via the consumer wizard. If a
-- school's consumer record doesn't exist yet, PART 2's INSERT simply won't
-- add a row for it (matches zero rows, not an error) -- it will NOT create
-- the school itself. Create any missing school via consumer_wizard.php
-- first, then re-run this script.
--
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- =====================================================================
-- PART 1 (READ-ONLY) -- confirm before inserting anything.
-- =====================================================================

-- 1a. Confirm groupid 3 really is the active "Ehel Academy Schools" group,
--     and see its parent consumer.
SELECT g.id AS groupid, g.slug, g.name, g.group_type, g.status,
       g.parentconsumerid, pc.name AS parent_name, pc.slug AS parent_slug
FROM mdlgx_local_prequran_org_group g
JOIN mdlgx_local_prequran_consumer pc ON pc.id = g.parentconsumerid
WHERE g.id = 3;

-- 1b. Do the three new schools exist yet as consumer records, and do they
--     already have a primaryworkspaceid set?
SELECT id AS consumerid, slug, name, status, primaryworkspaceid, website_mode
FROM mdlgx_local_prequran_consumer
WHERE name LIKE '%Ehel%Adult%'
   OR name LIKE '%Ehel%Skills%'
   OR name LIKE '%Ehel%Tech%';

-- 1c. Are any of the three already linked into groupid 3 (partially done)?
SELECT gm.id AS memberrowid, gm.groupid, gm.memberid AS workspaceid,
       gm.relationship_type, gm.status AS member_status,
       c.slug AS school_slug, c.name AS school_name
FROM mdlgx_local_prequran_org_group_member gm
LEFT JOIN mdlgx_local_prequran_consumer c ON c.primaryworkspaceid = gm.memberid
WHERE gm.groupid = 3;

-- =====================================================================
-- PART 2 -- link each school found in 1b that isn't already linked per 1c.
-- Safe to re-run: the (groupid, member_type, memberid, group_role) unique
-- key means a school already linked is simply skipped by the NOT EXISTS
-- guard below, not duplicated or errored on.
-- =====================================================================

INSERT INTO mdlgx_local_prequran_org_group_member
    (groupid, member_type, memberid, relationship_type, group_role,
     access_scope, inherit_sensitive_access, status, createdby,
     timecreated, timemodified)
SELECT sibling.groupid, sibling.member_type, c.primaryworkspaceid,
       sibling.relationship_type, sibling.group_role, sibling.access_scope,
       sibling.inherit_sensitive_access, sibling.status, sibling.createdby,
       UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdlgx_local_prequran_consumer c
CROSS JOIN (
    SELECT groupid, member_type, relationship_type, group_role, access_scope,
           inherit_sensitive_access, status, createdby
    FROM mdlgx_local_prequran_org_group_member
    WHERE groupid = 3 AND status = 'active'
    LIMIT 1
) AS sibling
WHERE (c.name LIKE '%Ehel%Adult%' OR c.name LIKE '%Ehel%Skills%' OR c.name LIKE '%Ehel%Tech%')
  AND c.status = 'active'
  AND c.primaryworkspaceid > 0
  AND NOT EXISTS (
        SELECT 1 FROM mdlgx_local_prequran_org_group_member gm
         WHERE gm.groupid = 3
           AND gm.member_type = 'workspace'
           AND gm.memberid = c.primaryworkspaceid
      )
LIMIT 3;

-- =====================================================================
-- PART 3 (READ-ONLY) -- confirm the final membership list.
-- =====================================================================

SELECT gm.id AS memberrowid, gm.groupid, gm.memberid AS workspaceid,
       gm.relationship_type, gm.status AS member_status,
       c.slug AS school_slug, c.name AS school_name
FROM mdlgx_local_prequran_org_group_member gm
LEFT JOIN mdlgx_local_prequran_consumer c ON c.primaryworkspaceid = gm.memberid
WHERE gm.groupid = 3
ORDER BY gm.id;
