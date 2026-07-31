-- Same check as check_ehel_primary_domain_trust.sql, for Ehel Languages
-- School. Confirms the consumer record's own settings, and whether
-- languages.ehelacademy.org / app.languages.ehelacademy.org are registered
-- as trusted domains.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

SELECT 'ehel_languages_consumer' AS check_name,
       c.id,
       c.slug,
       c.name,
       c.consumer_type,
       c.website_mode,
       c.defaultpublicpath,
       c.status
FROM mdlgx_local_prequran_consumer c
WHERE c.name LIKE '%Ehel Languages%'
   OR c.slug LIKE '%ehel-languages%';

SELECT 'ehel_languages_domains' AS check_name,
       d.id,
       d.domain,
       d.domain_type,
       d.isprimary,
       d.status,
       d.verificationstatus,
       d.consumerid,
       d.workspaceid,
       c.slug AS consumer_slug
FROM mdlgx_local_prequran_consumer_domain d
JOIN mdlgx_local_prequran_consumer c ON c.id = d.consumerid
WHERE d.domain IN ('languages.ehelacademy.org', 'app.languages.ehelacademy.org');
