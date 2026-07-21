-- Migration: add browser focus-mode support to existing SEB exam tables.
-- Run in phpMyAdmin against ehelacad_quraantest ONLY if the exam tables were
-- created before focus mode (i.e. they lack the mode / focus_breaks columns).
-- MariaDB supports IF NOT EXISTS on ADD COLUMN; on plain MySQL, drop the
-- "IF NOT EXISTS" and skip any column that already exists.

ALTER TABLE mdlgx_local_prequran_seb_exam
    ADD COLUMN IF NOT EXISTS mode VARCHAR(20) NOT NULL DEFAULT 'seb' AFTER embedurl;

ALTER TABLE mdlgx_local_prequran_seb_attempt
    ADD COLUMN IF NOT EXISTS focus_breaks BIGINT(10) NOT NULL DEFAULT 0 AFTER sebverified;

SELECT 'seb exam focus-mode columns ready' AS result;
