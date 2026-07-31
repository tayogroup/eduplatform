-- Ehel Languages School (consumerid 7) has a different problem than Primary
-- did. Its consumer record has:
--   website_mode      = 'external'
--   defaultpublicpath = '/languages.ehelacademy.org'   <- not a real Moodle
--                                                          route, looks like
--                                                          the domain was
--                                                          typed into the
--                                                          "Default public
--                                                          path" field by
--                                                          mistake
-- Because website_mode isn't 'hosted', consumer_wizard.php deliberately
-- never registers a public domain trust row (it assumes "external" means
-- your real site lives on someone else's server). That's why
-- languages.ehelacademy.org has no row at all in local_prequran_consumer_domain,
-- unlike app.languages.ehelacademy.org which does.
--
-- This corrects the consumer record back to Hosted mode with a valid public
-- route (matching what Ehel Primary already has), clears the now-irrelevant
-- external website URL, then inserts the missing public domain row the same
-- way pqhi_upsert_consumer_domain() would if the wizard had been submitted
-- correctly in Hosted mode.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Fix the consumer record.
UPDATE mdlgx_local_prequran_consumer
SET website_mode = 'hosted',
    externalwebsiteurl = '',
    defaultpublicpath = '/local/hubredirect/consumer_landing.php',
    timemodified = UNIX_TIMESTAMP()
WHERE id = 7
  AND slug = 'ehel-languages';

-- 2. Insert the missing public domain row.
INSERT INTO mdlgx_local_prequran_consumer_domain
    (consumerid, workspaceid, domain, domain_type, isprimary, sslstatus,
     verificationstatus, verifiedat, status, createdby, timecreated, timemodified)
SELECT
    consumerid,
    workspaceid,
    'languages.ehelacademy.org',
    'public',
    1,
    'not_checked',
    'pending_dns',
    0,
    'active',
    createdby,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
FROM mdlgx_local_prequran_consumer_domain
WHERE domain = 'app.languages.ehelacademy.org'
LIMIT 1;

-- 3. Match the wizard's own isprimary convention (public domain is primary
--    once one exists; app domain steps down).
UPDATE mdlgx_local_prequran_consumer_domain
SET isprimary = 0
WHERE domain = 'app.languages.ehelacademy.org';

-- 4. Confirm everything now looks right.
SELECT 'consumer_after' AS check_name, id, slug, website_mode, externalwebsiteurl, defaultpublicpath
FROM mdlgx_local_prequran_consumer
WHERE id = 7;

SELECT 'domains_after' AS check_name, id, domain, domain_type, isprimary, status, verificationstatus
FROM mdlgx_local_prequran_consumer_domain
WHERE domain IN ('languages.ehelacademy.org', 'app.languages.ehelacademy.org');
