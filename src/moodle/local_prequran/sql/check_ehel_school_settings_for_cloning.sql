-- READ-ONLY. Pulls the full settings of the two existing Ehel schools
-- (K-12, Languages) so the consumer_wizard.php inputs for the two new
-- schools (Ehel Skills School, Ehel Tech School) can be kept consistent
-- (institution type, teaching method, operator type, branding, domain
-- pattern, routes).
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

SELECT c.id AS consumerid, c.slug, c.name, c.consumer_type, c.institution_type,
       c.faith_subcategory, c.teaching_method, c.operator_type,
       c.website_mode, c.externalwebsiteurl, c.domainmanagement, c.portallabel,
       c.brandingsource, c.intakelocation, c.integrationmethod,
       c.defaultpublicpath, c.defaultdashboardpath,
       c.primaryworkspaceid, c.supportemail, c.logourl, c.status,
       c.themejson, c.copyjson
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer c
WHERE c.slug IN ('ehel-k12', 'ehel-languages', 'ehel-academy')
ORDER BY c.id;

SELECT d.consumerid, d.domain, d.domain_type, d.isprimary, d.status
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer_domain d
JOIN ehelacad_quraantest.mdlgx_local_prequran_consumer c ON c.id = d.consumerid
WHERE c.slug IN ('ehel-k12', 'ehel-languages', 'ehel-academy')
ORDER BY d.consumerid, d.domain_type;

SELECT w.*
FROM ehelacad_quraantest.mdlgx_local_prequran_workspace w
WHERE w.id IN (
    SELECT primaryworkspaceid FROM ehelacad_quraantest.mdlgx_local_prequran_consumer
    WHERE slug IN ('ehel-k12', 'ehel-languages', 'ehel-academy')
);
