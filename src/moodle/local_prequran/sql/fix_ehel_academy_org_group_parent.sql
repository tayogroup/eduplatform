-- Fixes the org_group "Ehel Academy Schools" (id=3), which was created with
-- parentconsumerid = 8 (Ehel K-12 School's own consumer id) instead of 6
-- (Ehel Academy, the actual parent). This is why
-- pqh_org_group_child_schools() in local_hubredirect/accesslib.php found no
-- child schools for app.ehelacademy.org, so the school-selection radio
-- buttons on public_intake.php never rendered.
-- The member rows (workspace 22 = Ehel Languages School, workspace 23 =
-- Ehel K-12 School, both relationship_type='owned_branch', status='active')
-- are already correct and are not touched here.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

UPDATE ehelacad_quraantest.mdlgx_local_prequran_org_group
SET parentconsumerid = 6,
    timemodified = UNIX_TIMESTAMP()
WHERE id = 3
  AND slug = 'ehel-academy-schools';

-- Verify: should now show parentconsumerid = 6, parent_name = "Ehel Academy".
SELECT g.id AS groupid, g.slug, g.name, g.group_type, g.status,
       g.parentconsumerid, pc.name AS parent_name
FROM ehelacad_quraantest.mdlgx_local_prequran_org_group g
JOIN ehelacad_quraantest.mdlgx_local_prequran_consumer pc ON pc.id = g.parentconsumerid
WHERE g.id = 3;
