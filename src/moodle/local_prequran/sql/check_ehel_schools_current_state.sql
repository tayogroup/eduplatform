-- READ-ONLY. Full current state of all Ehel-family consumers and their
-- org_group membership, before adding Ehel Adult School. Checks whether
-- Ehel Skills School / Ehel Tech School were already created via the wizard
-- (their org_group link is still pending either way) and confirms no slug
-- collisions before creating the next school.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Every Ehel consumer that exists right now.
SELECT c.id AS consumerid, c.slug, c.name, c.institution_type,
       c.website_mode, c.primaryworkspaceid, c.status, c.timecreated
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer c
WHERE c.slug LIKE '%ehel%' OR c.name LIKE '%Ehel%'
ORDER BY c.id;

-- 2. Domains for each of those.
SELECT d.consumerid, d.domain, d.domain_type, d.isprimary, d.status
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer_domain d
JOIN ehelacad_quraantest.mdlgx_local_prequran_consumer c ON c.id = d.consumerid
WHERE c.slug LIKE '%ehel%' OR c.name LIKE '%Ehel%'
ORDER BY d.consumerid, d.domain_type;

-- 3. Current org_group_member links under the "Ehel Academy Schools" group
--    (groupid=3) -- shows exactly which schools are already linked, so we
--    know which ones (if any) are missing.
SELECT gm.id AS memberrowid, gm.groupid, gm.memberid AS workspaceid,
       gm.relationship_type, gm.status AS member_status,
       c.slug AS school_slug, c.name AS school_name
FROM ehelacad_quraantest.mdlgx_local_prequran_org_group_member gm
LEFT JOIN ehelacad_quraantest.mdlgx_local_prequran_consumer c ON c.primaryworkspaceid = gm.memberid
WHERE gm.groupid = 3
ORDER BY gm.id;
