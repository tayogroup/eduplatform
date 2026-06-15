-- Verify public intake request table.
-- Replace mdlgx_ with your Moodle database prefix if needed.

SELECT 'mdlgx_local_prequran_intake_request' AS table_name,
       CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END AS table_status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'mdlgx_local_prequran_intake_request';

SELECT COLUMN_NAME
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'mdlgx_local_prequran_intake_request'
  AND COLUMN_NAME IN (
      'parent_name',
      'parent_email',
      'student_display_name',
      'timezone',
      'availability_json',
      'availability_summary',
      'status',
      'matched_groupid',
      'transferred_userid'
  )
ORDER BY ORDINAL_POSITION;

SELECT id,
       parent_name,
       parent_email,
       student_display_name,
       timezone,
       status,
       FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_intake_request
ORDER BY id DESC
LIMIT 25;
