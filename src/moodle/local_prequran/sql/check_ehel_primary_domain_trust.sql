-- Confirm whether primary.ehelacademy.org and app.primary.ehelacademy.org
-- are actually registered as trusted domains for the Ehel Primary School
-- consumer. If a domain is missing here, or its consumer's website_mode
-- isn't 'hosted', that's why visitors fall back to the platform's own
-- generic landing page instead of the institution's own.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

SELECT 'ehel_primary_consumer' AS check_name,
       c.id,
       c.slug,
       c.name,
       c.consumer_type,
       c.website_mode,
       c.defaultpublicpath,
       c.status
FROM mdlgx_local_prequran_consumer c
WHERE c.name LIKE '%Ehel Primary%'
   OR c.slug LIKE '%ehel-primary%';

SELECT 'ehel_primary_domains' AS check_name,
       d.id,
       d.domain,
       d.domain_type,
       d.isprimary,
       d.status,
       d.verificationstatus,
       c.slug AS consumer_slug
FROM mdlgx_local_prequran_consumer_domain d
JOIN mdlgx_local_prequran_consumer c ON c.id = d.consumerid
WHERE d.domain IN ('primary.ehelacademy.org', 'app.primary.ehelacademy.org');
