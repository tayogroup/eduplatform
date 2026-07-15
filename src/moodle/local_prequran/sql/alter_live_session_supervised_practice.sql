ALTER TABLE mdlgx_local_prequran_live_session
  ADD COLUMN IF NOT EXISTS session_type VARCHAR(40) NOT NULL DEFAULT 'teacher_led' AFTER teacherid,
  ADD COLUMN IF NOT EXISTS teacher_required TINYINT(1) NOT NULL DEFAULT 1 AFTER session_type,
  ADD COLUMN IF NOT EXISTS report_to_teacherid BIGINT(20) NOT NULL DEFAULT 0 AFTER teacher_required;

UPDATE mdlgx_local_prequran_live_session
   SET session_type = 'teacher_led',
       teacher_required = 1,
       report_to_teacherid = CASE WHEN report_to_teacherid = 0 THEN teacherid ELSE report_to_teacherid END
 WHERE session_type = ''
    OR session_type IS NULL
    OR report_to_teacherid = 0;

SET @has_type_index := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'mdlgx_local_prequran_live_session'
       AND INDEX_NAME = 'mdlgx_lpreqlive_session_type_ix'
);
SET @sql := IF(@has_type_index = 0,
    'CREATE INDEX mdlgx_lpreqlive_session_type_ix ON mdlgx_local_prequran_live_session (session_type, status, scheduled_start)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_report_index := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'mdlgx_local_prequran_live_session'
       AND INDEX_NAME = 'mdlgx_lpreqlive_session_report_ix'
);
SET @sql := IF(@has_report_index = 0,
    'CREATE INDEX mdlgx_lpreqlive_session_report_ix ON mdlgx_local_prequran_live_session (report_to_teacherid, scheduled_start)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
