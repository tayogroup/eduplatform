-- Teacher shift column (mirrors upgrade step 202607310029; add-if-missing in
-- the upgrade makes running both safe).
--
--   teacher_profile.shift: '' (unrestricted) | 'shift1' | 'shift2'
--     shift1 = 10:00-20:00 EAT day window   (07:00-17:00 UTC)
--     shift2 = 20:00-06:00 EAT night window (17:00-03:00 UTC, wraps midnight)
--   Matching uses declared availability INTERSECTED with the shift window.
--
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

ALTER TABLE ehelacad_quraantest.mdlgx_local_prequran_teacher_profile
    ADD COLUMN shift VARCHAR(20) NOT NULL DEFAULT '';

SHOW COLUMNS FROM ehelacad_quraantest.mdlgx_local_prequran_teacher_profile LIKE 'shift';
