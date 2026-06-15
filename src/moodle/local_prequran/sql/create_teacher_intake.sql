-- Teacher intake / teacher creation profile table.
-- Replace mdlgx_ with your Moodle database prefix if needed.

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_teacher_profile (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  userid BIGINT(20) NOT NULL,
  teacher_display_name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  teacher_phone VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  preferred_contact VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'email',
  gender VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  country VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  city VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  timezone VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  primary_language VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  other_languages LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  courses_taught LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  levels_taught LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  max_students_per_class BIGINT(20) NOT NULL DEFAULT 9,
  max_weekly_hours BIGINT(20) NOT NULL DEFAULT 10,
  availability_summary LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  bbb_trained TINYINT(1) NOT NULL DEFAULT 0,
  safeguarding_trained TINYINT(1) NOT NULL DEFAULT 0,
  recording_qa_ack TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  admin_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  createdby BIGINT(20) NOT NULL DEFAULT 0,
  timecreated BIGINT(20) NOT NULL DEFAULT 0,
  timemodified BIGINT(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY mdlgx_preq_teacherprof_user_uix (userid),
  KEY mdlgx_preq_teacherprof_status_ix (status, timemodified),
  KEY mdlgx_preq_teacherprof_match_ix (timezone, primary_language, gender),
  KEY mdlgx_preq_teacherprof_createdby_ix (createdby)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
