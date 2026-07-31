-- Root cause confirmed: app.primary.ehelacademy.org is registered and
-- trusted (local_prequran_consumer_domain), but the bare public domain
-- primary.ehelacademy.org was never written -- the wizard's "EduPlatform-
-- hosted public domain" field must have been left blank on the submission
-- that actually stuck for Ehel Primary School (consumerid 8).
--
-- pqh_resolve_consumer_context() (accesslib.php) does an exact match:
--   WHERE domain = '<current host>' AND status = 'active'
-- No row for the bare domain => no match => falls back to the generic
-- 'eduplatform' context => platform_landing.php, regardless of what's set
-- on the Ehel Primary consumer record itself (which is already correct).
--
-- This inserts the missing row the same way pqhi_upsert_consumer_domain()
-- would, copying consumerid/workspaceid/createdby from the sibling app
-- domain row, then flips isprimary so public/app match what a correct
-- wizard resubmission would have produced (public primary, app secondary --
-- matches pqhi_sync_consumer_domain()'s own isprimary logic).
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Insert the missing public domain row.
INSERT INTO mdlgx_local_prequran_consumer_domain
    (consumerid, workspaceid, domain, domain_type, isprimary, sslstatus,
     verificationstatus, verifiedat, status, createdby, timecreated, timemodified)
SELECT
    consumerid,
    workspaceid,
    'primary.ehelacademy.org',
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
WHERE domain = 'app.primary.ehelacademy.org'
LIMIT 1;

-- 2. Match the wizard's own isprimary convention (public domain is primary
--    once one exists; app domain steps down).
UPDATE mdlgx_local_prequran_consumer_domain
SET isprimary = 0
WHERE domain = 'app.primary.ehelacademy.org';

-- 3. Confirm both rows now look right.
SELECT id, domain, domain_type, isprimary, status, verificationstatus
FROM mdlgx_local_prequran_consumer_domain
WHERE domain IN ('primary.ehelacademy.org', 'app.primary.ehelacademy.org');
