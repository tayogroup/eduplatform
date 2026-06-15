CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_live_recording (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  sessionid BIGINT(20) NOT NULL,
  bbb_record_id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  bbb_meeting_id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  playback_url LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  playback_format VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  duration_minutes INT(10) NOT NULL DEFAULT 0,
  published TINYINT(1) NOT NULL DEFAULT 0,
  visible_to_parent TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  reviewedby BIGINT(20) NOT NULL DEFAULT 0,
  reviewedat BIGINT(20) NOT NULL DEFAULT 0,
  expiresat BIGINT(20) NOT NULL DEFAULT 0,
  raw_metadata LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  timecreated BIGINT(20) NOT NULL,
  timemodified BIGINT(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY mdlgx_lpreqlive_rec_record_uix (bbb_record_id),
  KEY mdlgx_lpreqlive_rec_session_ix (sessionid),
  KEY mdlgx_lpreqlive_rec_meeting_ix (bbb_meeting_id),
  KEY mdlgx_lpreqlive_rec_parent_status_ix (visible_to_parent, status),
  KEY mdlgx_lpreqlive_rec_expires_ix (expiresat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_live_consent (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  studentid BIGINT(20) NOT NULL,
  guardianid BIGINT(20) NOT NULL,
  consent_type VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'live_session',
  granted TINYINT(1) NOT NULL DEFAULT 0,
  version VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1',
  consent_source VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  details LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  timecreated BIGINT(20) NOT NULL,
  timemodified BIGINT(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY mdlgx_lpreqlive_cons_student_guard_type_uix (studentid, guardianid, consent_type),
  KEY mdlgx_lpreqlive_cons_guardian_ix (guardianid),
  KEY mdlgx_lpreqlive_cons_type_granted_ix (consent_type, granted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_live_audit (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  sessionid BIGINT(20) NOT NULL DEFAULT 0,
  actorid BIGINT(20) NOT NULL DEFAULT 0,
  action VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  targettype VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  targetid BIGINT(20) NOT NULL DEFAULT 0,
  details LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  timecreated BIGINT(20) NOT NULL,
  PRIMARY KEY (id),
  KEY mdlgx_lpreqlive_audit_session_time_ix (sessionid, timecreated),
  KEY mdlgx_lpreqlive_audit_actor_time_ix (actorid, timecreated),
  KEY mdlgx_lpreqlive_audit_action_time_ix (action, timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
