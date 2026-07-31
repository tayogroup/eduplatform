-- Renames every remaining "Ehel Primary School" / "Ehel K-12 School" row to
-- "Ehel Primary & Secondary" -- display name only. The slug and domains are
-- deliberately left unchanged, since they're tied to the DNS/domain-trust
-- setup already working correctly (same reasoning as
-- rename_ehel_primary_to_k12.sql).
--
-- Broader than a single id=23 match on purpose: after running
-- rename_ehel_k12_to_primary_secondary.sql once, "Ehel Primary School" was
-- reported still showing in a second place -- rename_ehel_primary_to_k12.sql
-- only ever targeted the consumer row matched by primaryworkspaceid = 23,
-- but the K-12 consumer/workspace pair may not be that tightly 1:1 (the
-- original consumer row was explicitly left on slug 'ehel-primary', so a
-- second consumer row using slug 'ehel-k12' -- the one the live URLs
-- actually use -- may exist and not carry primaryworkspaceid = 23 at all).
-- This version matches by slug and by workspace id, not just
-- primaryworkspaceid, so it can't miss a second row the same way.
--
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Diagnostic: find every row anywhere still carrying the old name(s),
--    regardless of how it's linked. Run this FIRST and read the results --
--    if anything unexpected shows up (a row you don't recognize, or more
--    than 1 row per table), stop and share the output before proceeding.
SELECT 'workspace_candidates' AS check_name, id, name, slug FROM mdlgx_local_prequran_workspace
 WHERE id = 23 OR slug IN ('ehel-primary', 'ehel-k12') OR name LIKE '%Primary%' OR name LIKE '%K-12%';
SELECT 'consumer_candidates' AS check_name, id, name, slug, primaryworkspaceid FROM mdlgx_local_prequran_consumer
 WHERE primaryworkspaceid = 23 OR slug IN ('ehel-primary', 'ehel-k12') OR name LIKE '%Primary%' OR name LIKE '%K-12%';

-- 2. Rename every matched row.
UPDATE mdlgx_local_prequran_workspace
SET name = 'Ehel Primary & Secondary', timemodified = UNIX_TIMESTAMP()
WHERE id = 23 OR slug IN ('ehel-primary', 'ehel-k12') OR name LIKE '%Primary%' OR name LIKE '%K-12%';

UPDATE mdlgx_local_prequran_consumer
SET name = 'Ehel Primary & Secondary', timemodified = UNIX_TIMESTAMP()
WHERE primaryworkspaceid = 23 OR slug IN ('ehel-primary', 'ehel-k12') OR name LIKE '%Primary%' OR name LIKE '%K-12%';

-- 3. Confirm it took -- both queries below should now show ONLY
--    "Ehel Primary & Secondary" in the name column, with no leftover rows.
SELECT 'after_workspace' AS check_name, id, name, slug FROM mdlgx_local_prequran_workspace
 WHERE id = 23 OR slug IN ('ehel-primary', 'ehel-k12');
SELECT 'after_consumer' AS check_name, id, name, slug, primaryworkspaceid FROM mdlgx_local_prequran_consumer
 WHERE primaryworkspaceid = 23 OR slug IN ('ehel-primary', 'ehel-k12');
