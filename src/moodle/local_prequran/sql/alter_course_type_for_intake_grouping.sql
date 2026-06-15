-- Add course selection to public intake, student profiles, matching pools, and class groups.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- Run each ALTER only if the matching column/index is missing.

ALTER TABLE mdlgx_local_prequran_intake_request
    ADD COLUMN course_type VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pre_quraan' AFTER special_needs;

ALTER TABLE mdlgx_local_prequran_student_profile
    ADD COLUMN course_type VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pre_quraan' AFTER special_needs;

ALTER TABLE mdlgx_local_prequran_group_pool
    ADD COLUMN course_type VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pre_quraan' AFTER title;

ALTER TABLE mdlgx_local_prequran_class_group
    ADD COLUMN course_type VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pre_quraan' AFTER title;

ALTER TABLE mdlgx_local_prequran_intake_request
    ADD INDEX mdlgx_preq_intreq_course_ix (course_type, status);

ALTER TABLE mdlgx_local_prequran_student_profile
    ADD INDEX mdlgx_preqstudprof_course_ix (course_type, status);

ALTER TABLE mdlgx_local_prequran_group_pool
    ADD INDEX mdlgx_preqgrpool_course_ix (course_type, status);

ALTER TABLE mdlgx_local_prequran_class_group
    ADD INDEX mdlgx_preqclassgrp_course_ix (course_type, status);
