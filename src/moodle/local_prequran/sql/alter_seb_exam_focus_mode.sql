-- Migration: add browser focus-mode support to existing SEB exam tables.
-- Run in phpMyAdmin against ehelacad_quraantest ONLY if the exam tables were
-- created before focus mode (i.e. they lack the mode / focus_breaks columns).
-- MariaDB supports IF NOT EXISTS on ADD COLUMN; on plain MySQL, drop the
-- "IF NOT EXISTS" and skip any column that already exists.

ALTER TABLE mdlgx_local_prequran_seb_exam
    ADD COLUMN IF NOT EXISTS mode VARCHAR(20) NOT NULL DEFAULT 'seb' AFTER embedurl;

ALTER TABLE mdlgx_local_prequran_seb_attempt
    ADD COLUMN IF NOT EXISTS focus_breaks BIGINT(10) NOT NULL DEFAULT 0 AFTER sebverified;

ALTER TABLE mdlgx_local_prequran_seb_exam
    ADD COLUMN IF NOT EXISTS proctoring TINYINT(1) NOT NULL DEFAULT 0 AFTER mode;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_seb_proctor (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    examid BIGINT(10) NOT NULL,
    userid BIGINT(10) NOT NULL,
    attemptid BIGINT(10) NOT NULL DEFAULT 0,
    type VARCHAR(20) NOT NULL DEFAULT '',
    detail TEXT NULL,
    imagedata LONGTEXT NULL,
    level BIGINT(10) NOT NULL DEFAULT 0,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_seb_proctor_examuser (examid, userid),
    KEY idx_seb_proctor_time (timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'seb exam focus-mode columns ready' AS result;
