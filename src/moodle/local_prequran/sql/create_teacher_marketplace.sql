-- Teacher/tutor marketplace request queue.
-- Replace mdlgx_ with your Moodle database prefix if needed.

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
