-- Student intake profile fields added 2026-06-28.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- Safe to rerun: each column is checked before it is added.

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_student_profile ADD COLUMN student_middle_name VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ''''',
        'SELECT ''mdlgx_local_prequran_student_profile.student_middle_name already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_student_profile'
      AND COLUMN_NAME = 'student_middle_name'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_student_profile ADD COLUMN student_access_type VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ''managed''',
        'SELECT ''mdlgx_local_prequran_student_profile.student_access_type already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_student_profile'
      AND COLUMN_NAME = 'student_access_type'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_student_profile ADD COLUMN preferred_teaching_language VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ''''',
        'SELECT ''mdlgx_local_prequran_student_profile.preferred_teaching_language already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_student_profile'
      AND COLUMN_NAME = 'preferred_teaching_language'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_student_profile ADD COLUMN tajweed_sub_level VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ''''',
        'SELECT ''mdlgx_local_prequran_student_profile.tajweed_sub_level already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_student_profile'
      AND COLUMN_NAME = 'tajweed_sub_level'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_student_profile ADD COLUMN parent_email_enabled TINYINT(1) NOT NULL DEFAULT 1',
        'SELECT ''mdlgx_local_prequran_student_profile.parent_email_enabled already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_student_profile'
      AND COLUMN_NAME = 'parent_email_enabled'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_intake_request ADD COLUMN student_middle_name VARCHAR(100) NOT NULL DEFAULT ''''',
        'SELECT ''mdlgx_local_prequran_intake_request.student_middle_name already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_intake_request'
      AND COLUMN_NAME = 'student_middle_name'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_intake_request ADD COLUMN student_access_type VARCHAR(40) NOT NULL DEFAULT ''managed''',
        'SELECT ''mdlgx_local_prequran_intake_request.student_access_type already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_intake_request'
      AND COLUMN_NAME = 'student_access_type'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_intake_request ADD COLUMN preferred_teaching_language VARCHAR(100) NOT NULL DEFAULT ''''',
        'SELECT ''mdlgx_local_prequran_intake_request.preferred_teaching_language already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_intake_request'
      AND COLUMN_NAME = 'preferred_teaching_language'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_intake_request ADD COLUMN tajweed_sub_level VARCHAR(40) NOT NULL DEFAULT ''''',
        'SELECT ''mdlgx_local_prequran_intake_request.tajweed_sub_level already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_intake_request'
      AND COLUMN_NAME = 'tajweed_sub_level'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_intake_request ADD COLUMN parent_email_enabled TINYINT(1) NOT NULL DEFAULT 1',
        'SELECT ''mdlgx_local_prequran_intake_request.parent_email_enabled already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_intake_request'
      AND COLUMN_NAME = 'parent_email_enabled'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
