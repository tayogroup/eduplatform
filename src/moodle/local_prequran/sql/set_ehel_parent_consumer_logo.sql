-- Sets local_prequran_consumer.logourl on the PARENT Ehel Academy consumer
-- (slug 'ehel-academy', workspace #16) to the same crest already used by the
-- five child schools.
--
-- Why this is needed: set_ehel_academy_dashboard_logo.sql scoped its UPDATE to
-- primaryworkspaceid IN (22, 23, 24, 25, 26) -- the schools only -- so the
-- parent row was left on its old value. Pages served from the parent's own
-- domain (app.ehelacademy.org: public_intake.php, public_teacher_intake.php,
-- consumer_landing.php, the dashboard/workspace left rail) all read logourl
-- from the consumer the request resolves to, so the parent kept showing the
-- old branding while the schools showed the crest.
--
-- Stored root-relative, not as a full https:// URL, so it resolves under any
-- of the Ehel domains -- same convention as the schools' rows.
--
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Diagnostic: run this FIRST and read the result. It shows what every Ehel
--    consumer currently points at, so you can confirm the parent is the odd
--    one out before changing anything. The five schools should already read
--    '/local/hubredirect/pix/ehel-academy-logo-transparent.png'.
SELECT id, name, slug, primaryworkspaceid, logourl
  FROM mdlgx_local_prequran_consumer
 WHERE slug LIKE 'ehel-%'
 ORDER BY primaryworkspaceid;

-- 2. Point the parent at the same crest as its schools.
UPDATE mdlgx_local_prequran_consumer
SET logourl = '/local/hubredirect/pix/ehel-academy-logo-transparent.png',
    timemodified = UNIX_TIMESTAMP()
WHERE slug = 'ehel-academy';

-- 3. Confirm: every row below should now show the same logourl.
SELECT id, name, slug, primaryworkspaceid, logourl
  FROM mdlgx_local_prequran_consumer
 WHERE slug LIKE 'ehel-%'
 ORDER BY primaryworkspaceid;
