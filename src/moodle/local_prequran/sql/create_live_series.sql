-- Phase 16: recurring live class series.
-- Replace mdlgx_ with your Moodle table prefix if needed.

CREATE TABLE mdlgx_local_prequran_live_series (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  cohortid BIGINT(20) NOT NULL DEFAULT 0,
  teacherid BIGINT(20) NOT NULL,
  title VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  lessonid VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  unitid VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  pattern VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none',
  weekdays VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  start_time VARCHAR(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  duration_minutes INT(10) NOT NULL DEFAULT 60,
  date_start BIGINT(20) NOT NULL DEFAULT 0,
  date_end BIGINT(20) NOT NULL DEFAULT 0,
  session_count INT(10) NOT NULL DEFAULT 0,
  status VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  createdby BIGINT(20) NOT NULL DEFAULT 0,
  cancelledby BIGINT(20) NOT NULL DEFAULT 0,
  cancellation_reason LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  timecreated BIGINT(20) NOT NULL,
  timemodified BIGINT(20) NOT NULL,
  PRIMARY KEY (id),
  KEY mdlgx_lpreqlive_series_teacher_ix (teacherid, date_start),
  KEY mdlgx_lpreqlive_series_status_ix (status, date_start),
  KEY mdlgx_lpreqlive_series_cohort_ix (cohortid, date_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE mdlgx_local_prequran_live_session
  ADD COLUMN seriesid BIGINT(20) NOT NULL DEFAULT 0 AFTER id,
  ADD COLUMN series_sequence INT(10) NOT NULL DEFAULT 0 AFTER seriesid,
  ADD KEY mdlgx_lpreqlive_session_series_ix (seriesid, scheduled_start);
