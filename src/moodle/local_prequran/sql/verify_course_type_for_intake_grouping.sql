-- Verify course selection is available across intake and grouping.
-- Replace mdlgx_ with your Moodle database prefix if needed.

SELECT 'mdlgx_local_prequran_intake_request.course_type' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END AS status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_intake_request'
  AND COLUMN_NAME = 'course_type'
UNION ALL
SELECT 'mdlgx_local_prequran_student_profile.course_type',
       CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_student_profile'
  AND COLUMN_NAME = 'course_type'
UNION ALL
SELECT 'mdlgx_local_prequran_group_pool.course_type',
       CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_group_pool'
  AND COLUMN_NAME = 'course_type'
UNION ALL
SELECT 'mdlgx_local_prequran_class_group.course_type',
       CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_class_group'
  AND COLUMN_NAME = 'course_type';

SELECT id, student_display_name, course_type, special_needs, FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_intake_request
ORDER BY id DESC
LIMIT 10;

SELECT userid, student_display_name, course_type, current_level, learning_base
FROM mdlgx_local_prequran_student_profile
ORDER BY id DESC
LIMIT 10;

SELECT id, title, course_type, timezone, language, current_level, learning_base, status
FROM mdlgx_local_prequran_class_group
ORDER BY id DESC
LIMIT 10;
