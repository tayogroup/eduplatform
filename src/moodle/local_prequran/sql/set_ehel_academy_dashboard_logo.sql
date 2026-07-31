-- Sets local_prequran_consumer.logourl to the Ehel Academy crest for the
-- dashboard/workspace left-nav brand mark (accesslib.php's
-- pqh_design_shell_html() and dashboard.php's own hand-rolled copy both now
-- render <img src="{logourl}"> instead of initials when this field is set --
-- see consumer_landing.php for the same, pre-existing pattern.
--
-- File already uploaded to the server at:
--   local/hubredirect/pix/ehel-academy-logo-transparent.png
-- Stored root-relative (matches the existing fallback convention in
-- pqh_consumer_hero_image_url()), not a full https:// URL, so it resolves
-- correctly under any of the schools' own domains.
--
-- Scoped to all 5 linked Ehel Academy schools (workspaceids 22-26, per
-- link_ehel_new_schools_org_group.sql / add_ehel_k12_role_portal_domains.sql
-- from earlier this session). Trim the WHERE clause to primaryworkspaceid = 23
-- if you only want this on K-12 for now.
--
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Confirm before: which consumer rows this will touch.
SELECT id, name, slug, primaryworkspaceid, logourl
  FROM mdlgx_local_prequran_consumer
 WHERE primaryworkspaceid IN (22, 23, 24, 25, 26);

-- 2. Set the logo.
UPDATE mdlgx_local_prequran_consumer
SET logourl = '/local/hubredirect/pix/ehel-academy-logo-transparent.png',
    timemodified = UNIX_TIMESTAMP()
WHERE primaryworkspaceid IN (22, 23, 24, 25, 26);

-- 3. Confirm after.
SELECT id, name, slug, primaryworkspaceid, logourl
  FROM mdlgx_local_prequran_consumer
 WHERE primaryworkspaceid IN (22, 23, 24, 25, 26);
