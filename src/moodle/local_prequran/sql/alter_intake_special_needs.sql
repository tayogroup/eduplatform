-- Add Special Needs yes/no flag to public intake requests and student profiles.
-- Replace mdlgx_ with your Moodle database prefix if needed.

ALTER TABLE mdlgx_local_prequran_intake_request
    ADD COLUMN special_needs VARCHAR(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'no' AFTER gender;

ALTER TABLE mdlgx_local_prequran_student_profile
    ADD COLUMN special_needs VARCHAR(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'no' AFTER gender;

ALTER TABLE mdlgx_local_prequran_student_profile
    ADD INDEX mdlgx_preqstudprof_special_ix (special_needs, status);
