CREATE TABLE mdlgx_local_prequran_teacher_student (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  workspaceid BIGINT(20) NOT NULL DEFAULT 0,
  teacherid BIGINT(20) NOT NULL,
  studentid BIGINT(20) NOT NULL,
  cohortid BIGINT(20) NOT NULL DEFAULT 0,
  status VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  assignedby BIGINT(20) NOT NULL DEFAULT 0,
  timecreated BIGINT(20) NOT NULL,
  timemodified BIGINT(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY mdlgx_preqtstu_work_teacher_uix (workspaceid, teacherid, studentid),
  KEY mdlgx_lpreqtstu_teacher_idx (teacherid),
  KEY mdlgx_lpreqtstu_student_idx (studentid),
  KEY mdlgx_lpreqtstu_cohort_idx (cohortid),
  KEY mdlgx_lpreqtstu_status_idx (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
