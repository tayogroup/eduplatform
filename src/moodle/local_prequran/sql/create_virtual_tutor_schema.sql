-- Virtual Tutor schema repair.
-- Replace mdlgx_ with your Moodle database table prefix if different.

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_vt_session (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  environment VARCHAR(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'production',
  studentid BIGINT(20) NOT NULL DEFAULT 0,
  parentid BIGINT(20) NOT NULL DEFAULT 0,
  teacherid BIGINT(20) NOT NULL DEFAULT 0,
  createdby BIGINT(20) NOT NULL DEFAULT 0,
  source_type VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'teacher_live_session',
  lessonid VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  unitid VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  step_id VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  step_title VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  lesson_url LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  teacher_instructions LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  context_json LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  session_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  ai_mode VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'guided_rule_based',
  ai_model VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  summary LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  startedat BIGINT(20) NOT NULL DEFAULT 0,
  closedat BIGINT(20) NOT NULL DEFAULT 0,
  timecreated BIGINT(20) NOT NULL DEFAULT 0,
  timemodified BIGINT(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY mdlgx_lpreqvts_student_ix (studentid, session_status, timemodified),
  KEY mdlgx_lpreqvts_teacher_ix (teacherid, timemodified),
  KEY mdlgx_lpreqvts_source_ix (source_type, timemodified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_vt_message (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  sessionid BIGINT(20) NOT NULL DEFAULT 0,
  senderid BIGINT(20) NOT NULL DEFAULT 0,
  sender_role VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  message LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  prompt_json LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  message_source VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  safety_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ok',
  timecreated BIGINT(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY mdlgx_lpreqvtm_session_ix (sessionid, timecreated),
  KEY mdlgx_lpreqvtm_sender_ix (senderid, timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SHOW TABLES LIKE 'mdlgx_local_prequran_vt_%';
