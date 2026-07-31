-- Course-cohort columns (mirrors upgrade step 202607310028 for installs where
-- the plugin upgrade will also run -- the upgrade uses add-if-missing, so
-- running BOTH is safe; this exists because the live DB is usually patched by
-- hand first).
--
--   group_pool / class_group . offeringid, moodlecourseid
--       -> a pool or group becomes a cohort OF a real course
--          ("Grade 2 English -- Nairobi cohort"), instead of only carrying the
--          catalog string course_type ('pre_quraan').
--   course_offering . sessions_per_week, session_minutes
--       -> the live-session requirement availability matching must satisfy
--          (e.g. 3 x 60).
--
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different. MySQL 8+ syntax (IF NOT EXISTS on ADD COLUMN
-- is MariaDB; plain MySQL will error on re-run -- if so, ignore duplicate
-- column errors or check first with SHOW COLUMNS.

ALTER TABLE ehelacad_quraantest.mdlgx_local_prequran_group_pool
    ADD COLUMN offeringid BIGINT(20) NOT NULL DEFAULT 0,
    ADD COLUMN moodlecourseid BIGINT(20) NOT NULL DEFAULT 0,
    ADD INDEX mdlgx_lpreqgrpool_off_ix (offeringid);

ALTER TABLE ehelacad_quraantest.mdlgx_local_prequran_class_group
    ADD COLUMN offeringid BIGINT(20) NOT NULL DEFAULT 0,
    ADD COLUMN moodlecourseid BIGINT(20) NOT NULL DEFAULT 0,
    ADD INDEX mdlgx_lpreqclsgrp_off_ix (offeringid);

ALTER TABLE ehelacad_quraantest.mdlgx_local_prequran_course_offering
    ADD COLUMN sessions_per_week BIGINT(10) NOT NULL DEFAULT 0,
    ADD COLUMN session_minutes BIGINT(10) NOT NULL DEFAULT 0;

-- Verify.
SHOW COLUMNS FROM ehelacad_quraantest.mdlgx_local_prequran_class_group LIKE 'offeringid';
SHOW COLUMNS FROM ehelacad_quraantest.mdlgx_local_prequran_course_offering LIKE 'sessions_per_week';
