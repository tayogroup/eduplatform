-- Verify local_prequran_org_group_member has every column the workspace
-- linking form writes to. "Error writing to database" when clicking
-- "Link workspace" usually means one of these is missing.
-- Hardcoded to the real database (ehelacad_quraantest) to avoid any
-- confusion over which database is "currently selected" in phpMyAdmin.

-- 1. Does the table even exist, and under what exact (prefixed) name?
SELECT 'org_group_member_table_candidates' AS check_name,
       table_name
FROM information_schema.tables
WHERE table_schema = 'ehelacad_quraantest'
  AND table_name LIKE '%local_prequran_org_group_member'
ORDER BY table_name;

-- 2. Every column that actually exists on it (empty result = table not found).
SELECT 'org_group_member_actual_columns' AS check_name,
       column_name,
       column_type,
       is_nullable
FROM information_schema.columns
WHERE table_schema = 'ehelacad_quraantest'
  AND table_name LIKE '%local_prequran_org_group_member'
ORDER BY ordinal_position;

-- 3. Same two checks for the parent table.
SELECT 'org_group_table_candidates' AS check_name,
       table_name
FROM information_schema.tables
WHERE table_schema = 'ehelacad_quraantest'
  AND table_name LIKE '%local_prequran_org_group'
  AND table_name NOT LIKE '%local_prequran_org_group_member'
ORDER BY table_name;

SELECT 'org_group_actual_columns' AS check_name,
       column_name,
       column_type,
       is_nullable
FROM information_schema.columns
WHERE table_schema = 'ehelacad_quraantest'
  AND table_name LIKE '%local_prequran_org_group'
  AND table_name NOT LIKE '%local_prequran_org_group_member'
ORDER BY ordinal_position;
