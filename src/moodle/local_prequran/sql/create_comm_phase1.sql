CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_comm_thread (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  type VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'announcement',
  cohortid BIGINT(20) NOT NULL DEFAULT 0,
  studentid BIGINT(20) NULL DEFAULT NULL,
  createdby BIGINT(20) NOT NULL,
  status VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  subject VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  lastmessageat BIGINT(20) NOT NULL DEFAULT 0,
  timecreated BIGINT(20) NOT NULL,
  timemodified BIGINT(20) NOT NULL,
  PRIMARY KEY (id),
  KEY mdlgx_lpreqcommthr_coh_type_status_ix (cohortid, type, status),
  KEY mdlgx_lpreqcommthr_stu_type_status_ix (studentid, type, status),
  KEY mdlgx_lpreqcommthr_lastmsg_ix (lastmessageat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_comm_participant (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  threadid BIGINT(20) NOT NULL,
  userid BIGINT(20) NOT NULL,
  role VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'teacher',
  canreply TINYINT(1) NOT NULL DEFAULT 0,
  lastreadmessageid BIGINT(20) NOT NULL DEFAULT 0,
  muted TINYINT(1) NOT NULL DEFAULT 0,
  timecreated BIGINT(20) NOT NULL,
  timemodified BIGINT(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY mdlgx_lpreqcommpart_thread_user_uix (threadid, userid),
  KEY mdlgx_lpreqcommpart_user_thread_ix (userid, threadid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_comm_message (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  threadid BIGINT(20) NOT NULL,
  senderid BIGINT(20) NOT NULL,
  studentid BIGINT(20) NULL DEFAULT NULL,
  messagekind VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  body LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  templatekey VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  status VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'visible',
  moderationflags LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  timecreated BIGINT(20) NOT NULL,
  timemodified BIGINT(20) NOT NULL,
  PRIMARY KEY (id),
  KEY mdlgx_lpreqcommmsg_thread_time_ix (threadid, timecreated),
  KEY mdlgx_lpreqcommmsg_student_time_ix (studentid, timecreated),
  KEY mdlgx_lpreqcommmsg_status_time_ix (status, timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_comm_audit (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  threadid BIGINT(20) NOT NULL,
  messageid BIGINT(20) NOT NULL DEFAULT 0,
  actorid BIGINT(20) NOT NULL,
  action VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  details LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  timecreated BIGINT(20) NOT NULL,
  PRIMARY KEY (id),
  KEY mdlgx_lpreqcommaud_thread_time_ix (threadid, timecreated),
  KEY mdlgx_lpreqcommaud_message_time_ix (messageid, timecreated),
  KEY mdlgx_lpreqcommaud_actor_time_ix (actorid, timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_comm_consent (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  studentid BIGINT(20) NOT NULL,
  guardianid BIGINT(20) NOT NULL,
  student_messaging_enabled TINYINT(1) NOT NULL DEFAULT 0,
  free_text_enabled TINYINT(1) NOT NULL DEFAULT 0,
  parent_visible TINYINT(1) NOT NULL DEFAULT 1,
  consent_source VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  timecreated BIGINT(20) NOT NULL,
  timemodified BIGINT(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY mdlgx_lpreqcommcons_stu_guard_uix (studentid, guardianid),
  KEY mdlgx_lpreqcommcons_guardian_ix (guardianid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
