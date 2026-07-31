-- READ-ONLY. Checks the current state of the k-12.ehelacademy.org /
-- app.k-12.ehelacademy.org domain rows, and the primary/consumer/workspace
-- slug rename, before deciding how to proceed after the duplicate-key error.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

SELECT id, consumerid, workspaceid, domain, domain_type, isprimary, status, verificationstatus
FROM mdlgx_local_prequran_consumer_domain
WHERE domain IN ('k-12.ehelacademy.org', 'app.k-12.ehelacademy.org', 'primary.ehelacademy.org', 'app.primary.ehelacademy.org');

SELECT id, name, slug FROM mdlgx_local_prequran_workspace WHERE id = 23;
SELECT id, name, slug FROM mdlgx_local_prequran_consumer WHERE id = 8;
