-- Adds District, Division, and Estate fields for the Ehel K-12 (primary
-- education) public_intake.php and student_intake.php forms.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- Safe to rerun: ADD COLUMN IF NOT EXISTS silently no-ops on a rerun.
-- Uses ADD COLUMN IF NOT EXISTS (MariaDB, and MySQL 8.0.29+) instead of the
-- INFORMATION_SCHEMA-based PREPARE/EXECUTE pattern used elsewhere in this
-- folder, since many shared-hosting DB users aren't granted direct access to
-- information_schema even though they can query their own tables fine.

ALTER TABLE mdlgx_local_prequran_intake_request
  ADD COLUMN IF NOT EXISTS district VARCHAR(120) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS division VARCHAR(120) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS estate VARCHAR(120) NOT NULL DEFAULT '';

ALTER TABLE mdlgx_local_prequran_student_profile
  ADD COLUMN IF NOT EXISTS district VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS division VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS estate VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';

-- Confirm all 6 columns landed (SHOW COLUMNS doesn't need information_schema
-- access -- it only needs SELECT on the table itself).
SHOW COLUMNS FROM mdlgx_local_prequran_intake_request WHERE Field IN ('district', 'division', 'estate');
SHOW COLUMNS FROM mdlgx_local_prequran_student_profile WHERE Field IN ('district', 'division', 'estate');
