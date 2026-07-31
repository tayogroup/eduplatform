-- READ-ONLY. Checks the exact fields logout.php (and other redirect logic)
-- reads to build the post-logout landing URL, for Ehel K-12 School
-- (consumerid 8) -- to find which field currently holds the stale literal
-- string "primary.ehelacademy.org" causing the malformed logout redirect.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

SELECT id, slug, name, website_mode, externalwebsiteurl, defaultpublicpath, defaultdashboardpath
FROM mdlgx_local_prequran_consumer
WHERE id = 8;
