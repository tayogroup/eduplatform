-- Verify Special Needs fields and recent values.
-- Replace mdlgx_ with your Moodle database prefix if needed.

SELECT
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
      'mdlgx_local_prequran_intake_request',
      'mdlgx_local_prequran_student_profile'
  )
  AND COLUMN_NAME = 'special_needs'
ORDER BY TABLE_NAME;

SELECT
    'intake_request' AS source_table,
    id,
    student_display_name,
    special_needs,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_intake_request
ORDER BY id DESC
LIMIT 10;

SELECT
    'student_profile' AS source_table,
    id,
    userid,
    student_display_name,
    special_needs,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_student_profile
ORDER BY id DESC
LIMIT 10;
