CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_workspace (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  slug VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  workspace_type VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'academy_managed',
  ownerid BIGINT(20) NOT NULL DEFAULT 0,
  status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  plan_code VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pilot',
  student_limit BIGINT(10) NOT NULL DEFAULT 0,
  teacher_limit BIGINT(10) NOT NULL DEFAULT 0,
  session_limit BIGINT(10) NOT NULL DEFAULT 0,
  storage_limit_mb BIGINT(20) NOT NULL DEFAULT 0,
  settingsjson LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  createdby BIGINT(20) NOT NULL DEFAULT 0,
  timecreated BIGINT(20) NOT NULL DEFAULT 0,
  timemodified BIGINT(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY mdlgx_preqwork_slug_uix (slug),
  KEY mdlgx_preqwork_type_ix (workspace_type, status),
  KEY mdlgx_preqwork_owner_ix (ownerid, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_workspace_member (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  workspaceid BIGINT(20) NOT NULL DEFAULT 0,
  userid BIGINT(20) NOT NULL DEFAULT 0,
  workspace_role VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  createdby BIGINT(20) NOT NULL DEFAULT 0,
  timecreated BIGINT(20) NOT NULL DEFAULT 0,
  timemodified BIGINT(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY mdlgx_preqworkmem_user_uix (workspaceid, userid, workspace_role),
  KEY mdlgx_preqworkmem_work_ix (workspaceid, workspace_role, status),
  KEY mdlgx_preqworkmem_user_ix (userid, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_workspace_material (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  workspaceid BIGINT(20) NOT NULL DEFAULT 0,
  title VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  material_type VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'link',
  course_key VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  description LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  source_url LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  metadatajson LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
  visibility VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'workspace',
  status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  createdby BIGINT(20) NOT NULL DEFAULT 0,
  timecreated BIGINT(20) NOT NULL DEFAULT 0,
  timemodified BIGINT(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY mdlgx_preqworkmat_work_ix (workspaceid, status),
  KEY mdlgx_preqworkmat_course_ix (course_key, visibility),
  KEY mdlgx_preqworkmat_type_ix (material_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_workspace_mat_assign (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  workspaceid BIGINT(20) NOT NULL DEFAULT 0,
  materialid BIGINT(20) NOT NULL DEFAULT 0,
  target_type VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  targetid BIGINT(20) NOT NULL DEFAULT 0,
  status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  assignedby BIGINT(20) NOT NULL DEFAULT 0,
  timecreated BIGINT(20) NOT NULL DEFAULT 0,
  timemodified BIGINT(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY mdlgx_preqworkmatass_uix (workspaceid, materialid, target_type, targetid),
  KEY mdlgx_preqworkmatass_work_ix (workspaceid, target_type, status),
  KEY mdlgx_preqworkmatass_mat_ix (materialid, status),
  KEY mdlgx_preqworkmatass_target_ix (targetid, target_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @preq_default_workspaceid := 0;

ALTER TABLE mdlgx_local_prequran_student_profile ADD COLUMN IF NOT EXISTS workspaceid BIGINT(20) NOT NULL DEFAULT 0;
ALTER TABLE mdlgx_local_prequran_group_pool ADD COLUMN IF NOT EXISTS workspaceid BIGINT(20) NOT NULL DEFAULT 0;
ALTER TABLE mdlgx_local_prequran_class_group ADD COLUMN IF NOT EXISTS workspaceid BIGINT(20) NOT NULL DEFAULT 0;
ALTER TABLE mdlgx_local_prequran_group_member ADD COLUMN IF NOT EXISTS workspaceid BIGINT(20) NOT NULL DEFAULT 0;
ALTER TABLE mdlgx_local_prequran_teacher_student ADD COLUMN IF NOT EXISTS workspaceid BIGINT(20) NOT NULL DEFAULT 0;
ALTER TABLE mdlgx_local_prequran_live_session ADD COLUMN IF NOT EXISTS workspaceid BIGINT(20) NOT NULL DEFAULT 0;
ALTER TABLE mdlgx_local_prequran_live_series ADD COLUMN IF NOT EXISTS workspaceid BIGINT(20) NOT NULL DEFAULT 0;
ALTER TABLE mdlgx_local_prequran_live_participant ADD COLUMN IF NOT EXISTS workspaceid BIGINT(20) NOT NULL DEFAULT 0;
ALTER TABLE mdlgx_local_prequran_live_attendance ADD COLUMN IF NOT EXISTS workspaceid BIGINT(20) NOT NULL DEFAULT 0;
ALTER TABLE mdlgx_local_prequran_live_note ADD COLUMN IF NOT EXISTS workspaceid BIGINT(20) NOT NULL DEFAULT 0;
ALTER TABLE mdlgx_local_prequran_live_recording ADD COLUMN IF NOT EXISTS workspaceid BIGINT(20) NOT NULL DEFAULT 0;
ALTER TABLE mdlgx_local_prequran_live_consent ADD COLUMN IF NOT EXISTS workspaceid BIGINT(20) NOT NULL DEFAULT 0;
ALTER TABLE mdlgx_local_prequran_intake_request ADD COLUMN IF NOT EXISTS workspaceid BIGINT(20) NOT NULL DEFAULT 0;

UPDATE mdlgx_local_prequran_student_profile SET workspaceid = @preq_default_workspaceid WHERE workspaceid = 0;
UPDATE mdlgx_local_prequran_group_pool SET workspaceid = @preq_default_workspaceid WHERE workspaceid = 0;
UPDATE mdlgx_local_prequran_class_group SET workspaceid = @preq_default_workspaceid WHERE workspaceid = 0;
UPDATE mdlgx_local_prequran_group_member SET workspaceid = @preq_default_workspaceid WHERE workspaceid = 0;
UPDATE mdlgx_local_prequran_teacher_student SET workspaceid = @preq_default_workspaceid WHERE workspaceid = 0;
UPDATE mdlgx_local_prequran_live_session SET workspaceid = @preq_default_workspaceid WHERE workspaceid = 0;
UPDATE mdlgx_local_prequran_live_series SET workspaceid = @preq_default_workspaceid WHERE workspaceid = 0;
UPDATE mdlgx_local_prequran_live_participant SET workspaceid = @preq_default_workspaceid WHERE workspaceid = 0;
UPDATE mdlgx_local_prequran_live_attendance SET workspaceid = @preq_default_workspaceid WHERE workspaceid = 0;
UPDATE mdlgx_local_prequran_live_note SET workspaceid = @preq_default_workspaceid WHERE workspaceid = 0;
UPDATE mdlgx_local_prequran_live_recording SET workspaceid = @preq_default_workspaceid WHERE workspaceid = 0;
UPDATE mdlgx_local_prequran_live_consent SET workspaceid = @preq_default_workspaceid WHERE workspaceid = 0;
UPDATE mdlgx_local_prequran_intake_request SET workspaceid = @preq_default_workspaceid WHERE workspaceid = 0;
