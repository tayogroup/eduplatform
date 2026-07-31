-- Renames "Ehel Primary School" to "Ehel K-12 School" -- display name only.
-- The slug (ehel-primary) and domains (primary.ehelacademy.org,
-- app.primary.ehelacademy.org) are deliberately left unchanged, since
-- they're tied to the DNS/domain-trust setup already working correctly --
-- changing them isn't needed just because the display name changes.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Confirm before/after: what currently has this name.
SELECT 'before_workspace' AS check_name, id, name, slug FROM mdlgx_local_prequran_workspace WHERE id = 23;
SELECT 'before_consumer' AS check_name, id, name, slug FROM mdlgx_local_prequran_consumer WHERE primaryworkspaceid = 23;

-- 2. Rename.
UPDATE mdlgx_local_prequran_workspace
SET name = 'Ehel K-12 School', timemodified = UNIX_TIMESTAMP()
WHERE id = 23;

UPDATE mdlgx_local_prequran_consumer
SET name = 'Ehel K-12 School', timemodified = UNIX_TIMESTAMP()
WHERE primaryworkspaceid = 23;

-- 3. Confirm it took.
SELECT 'after_workspace' AS check_name, id, name, slug FROM mdlgx_local_prequran_workspace WHERE id = 23;
SELECT 'after_consumer' AS check_name, id, name, slug FROM mdlgx_local_prequran_consumer WHERE primaryworkspaceid = 23;
