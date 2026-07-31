-- READ-ONLY. Lists every field for every active student in the Ehel K-12
-- workspace/school (display name is now "Ehel Primary & Secondary", but the
-- workspace id/slug were deliberately left unchanged by
-- rename_ehel_k12_to_primary_secondary.sql, so matching on id/slug here is
-- still correct).
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Diagnostic: confirm which workspace this resolves to before trusting
--    the full listing below. Should return exactly one row.
SELECT id, name, slug, status
FROM mdlgx_local_prequran_workspace
WHERE id = 23 OR slug IN ('ehel-primary', 'ehel-k12');

-- 2. Full field listing: core account fields (u.*), workspace membership
--    fields, and every extended profile field (sp.*). The profile join is
--    LEFT so a student without a profile row yet still shows up (their
--    profile columns will just be NULL).
--    Note: both mdlgx_user and the profile table have their own "id" column,
--    so the result has two "id" columns -- the first is the user id, the
--    second (from the profile table) is just that table's internal row id.
SELECT
    u.*,
    wm.workspace_role,
    wm.status      AS membership_status,
    wm.timecreated AS member_since,
    wm.timemodified AS membership_last_modified,
    sp.*
FROM mdlgx_local_prequran_workspace w
JOIN mdlgx_local_prequran_workspace_member wm ON wm.workspaceid = w.id
JOIN mdlgx_user u ON u.id = wm.userid
LEFT JOIN mdlgx_local_prequran_student_profile sp ON sp.userid = u.id
WHERE (w.id = 23 OR w.slug IN ('ehel-primary', 'ehel-k12'))
  AND wm.workspace_role = 'student'
  AND wm.status = 'active'
  AND u.deleted = 0
ORDER BY u.lastname, u.firstname;
