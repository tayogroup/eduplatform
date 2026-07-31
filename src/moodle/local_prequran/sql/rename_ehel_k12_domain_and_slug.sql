-- Renames the consumer/workspace slug from ehel-primary -> ehel-k12, adds
-- the new k-12.ehelacademy.org / app.k-12.ehelacademy.org domain trust rows,
-- and fully decommissions (archives, not hard-deletes) the old
-- primary.ehelacademy.org / app.primary.ehelacademy.org rows -- per "do not
-- keep primary.ehelacademy.org, the school has no students/teachers yet."
--
-- IMPORTANT: run the DNS + cPanel + config.php allowlist steps (given
-- separately) BEFORE or immediately after this, since this alone does not
-- make the new domain reachable -- it only tells the platform to trust it
-- once DNS/SSL/hosting are in place.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Rename the slug on both the workspace and consumer records.
UPDATE mdlgx_local_prequran_workspace
SET slug = 'ehel-k12', timemodified = UNIX_TIMESTAMP()
WHERE id = 23;

UPDATE mdlgx_local_prequran_consumer
SET slug = 'ehel-k12', timemodified = UNIX_TIMESTAMP()
WHERE id = 8;

-- 2. Insert the new public domain (k-12.ehelacademy.org), copying
--    consumerid/workspaceid/createdby from the existing app domain row.
INSERT INTO mdlgx_local_prequran_consumer_domain
    (consumerid, workspaceid, domain, domain_type, isprimary, sslstatus, verificationstatus, verifiedat, status, createdby, timecreated, timemodified)
SELECT consumerid, workspaceid, 'k-12.ehelacademy.org', 'public', 1, 'not_checked', 'pending_dns', 0, 'active', createdby, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdlgx_local_prequran_consumer_domain
WHERE domain = 'app.primary.ehelacademy.org'
LIMIT 1;

-- 3. Insert the new app/portal domain (app.k-12.ehelacademy.org).
INSERT INTO mdlgx_local_prequran_consumer_domain
    (consumerid, workspaceid, domain, domain_type, isprimary, sslstatus, verificationstatus, verifiedat, status, createdby, timecreated, timemodified)
SELECT consumerid, workspaceid, 'app.k-12.ehelacademy.org', 'app', 0, 'not_checked', 'pending_dns', 0, 'active', createdby, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdlgx_local_prequran_consumer_domain
WHERE domain = 'app.primary.ehelacademy.org'
LIMIT 1;

-- 4. Archive (not delete) the two old domains -- fully decommissioned, but
--    reversible if something goes wrong.
UPDATE mdlgx_local_prequran_consumer_domain
SET status = 'archived', isprimary = 0, timemodified = UNIX_TIMESTAMP()
WHERE domain IN ('primary.ehelacademy.org', 'app.primary.ehelacademy.org');

-- 5. Confirm the final state.
SELECT id, domain, domain_type, isprimary, status, verificationstatus
FROM mdlgx_local_prequran_consumer_domain
WHERE consumerid = 8
ORDER BY status ASC, domain_type ASC;

SELECT id, name, slug FROM mdlgx_local_prequran_workspace WHERE id = 23;
SELECT id, name, slug FROM mdlgx_local_prequran_consumer WHERE id = 8;
