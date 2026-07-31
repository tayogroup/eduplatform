-- Fix for "Error writing to database" when linking a workspace to a group
-- with multiple Access scope boxes checked. access_scope was VARCHAR(40),
-- but the comma-joined value of all four scopes
-- ("governance,operations,audit,shared_support") is 41 characters -- one
-- over the limit, which MySQL strict mode rejects outright rather than
-- truncating. This widens the column; it's a pure widen (no data loss) and
-- safe to run regardless of what's currently stored in it.
-- Hardcoded to the real database (ehelacad_quraantest); swap the table name
-- below if your prefix isn't mdlgx_.

-- 1. Confirm current column width before changing anything.
SELECT 'access_scope_before' AS check_name, column_name, column_type
FROM information_schema.columns
WHERE table_schema = 'ehelacad_quraantest'
  AND table_name = 'mdlgx_local_prequran_org_group_member'
  AND column_name = 'access_scope';

-- 2. Widen it.
ALTER TABLE mdlgx_local_prequran_org_group_member
    MODIFY access_scope VARCHAR(80) NOT NULL DEFAULT 'governance';

-- 3. Confirm it took.
SELECT 'access_scope_after' AS check_name, column_name, column_type
FROM information_schema.columns
WHERE table_schema = 'ehelacad_quraantest'
  AND table_name = 'mdlgx_local_prequran_org_group_member'
  AND column_name = 'access_scope';
