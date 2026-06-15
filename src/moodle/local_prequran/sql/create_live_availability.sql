-- Phase 19: teacher live-class availability windows.
-- Replace mdlgx_ with your Moodle table prefix if needed.

CREATE TABLE mdlgx_local_prequran_live_availability (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  teacherid BIGINT(20) NOT NULL,
  weekday TINYINT(1) NOT NULL DEFAULT 0,
  start_minute INT(10) NOT NULL DEFAULT 0,
  end_minute INT(10) NOT NULL DEFAULT 0,
  timezone VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  status VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  createdby BIGINT(20) NOT NULL DEFAULT 0,
  timecreated BIGINT(20) NOT NULL,
  timemodified BIGINT(20) NOT NULL,
  PRIMARY KEY (id),
  KEY mdlgx_lpreqlive_avail_teacher_ix (teacherid, weekday, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
