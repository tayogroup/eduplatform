-- Teacher/tutor marketplace upgrade for an existing Moodle database.
-- Run this in the Moodle database, not information_schema.
-- Replace mdlgx_ with your Moodle table prefix if different.

ALTER TABLE mdlgx_local_prequran_teacher_profile
  ADD COLUMN marketplace_visible TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN marketplace_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  ADD COLUMN marketplace_bio LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN marketplace_skills LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN marketplace_experience LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN marketplace_education LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN marketplace_teaching_style LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN marketplace_courses LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN vetting_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_reviewed',
  ADD COLUMN vetting_summary LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN vetting_reviewedby BIGINT(20) NOT NULL DEFAULT 0,
  ADD COLUMN vetting_reviewedat BIGINT(20) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_teacher_request (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  teacherid BIGINT(20) NOT NULL DEFAULT 0,
  parentid BIGINT(20) NOT NULL DEFAULT 0,
  studentid BIGINT(20) NOT NULL DEFAULT 0,
  request_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  message LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  threadid BIGINT(20) NOT NULL DEFAULT 0,
  admin_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  reviewedby BIGINT(20) NOT NULL DEFAULT 0,
  reviewedat BIGINT(20) NOT NULL DEFAULT 0,
  timecreated BIGINT(20) NOT NULL DEFAULT 0,
  timemodified BIGINT(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY mdlgx_preq_treq_teacher_ix (teacherid, request_status),
  KEY mdlgx_preq_treq_parent_ix (parentid, timecreated),
  KEY mdlgx_preq_treq_student_ix (studentid, request_status),
  KEY mdlgx_preq_treq_thread_ix (threadid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX mdlgx_preq_teacherprof_market_ix
  ON mdlgx_local_prequran_teacher_profile (marketplace_visible, marketplace_status, status);

CREATE INDEX mdlgx_preq_teacherprof_vetting_ix
  ON mdlgx_local_prequran_teacher_profile (vetting_status, vetting_reviewedat);
