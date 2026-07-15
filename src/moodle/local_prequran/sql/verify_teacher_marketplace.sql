-- If phpMyAdmin is currently opened on information_schema, DATABASE() will not be
-- your Moodle database. These discovery checks show the real schema/table prefix.

SELECT 'current_selected_database' AS check_name,
       DATABASE() AS value;

SELECT 'teacher_profile_table_candidates' AS check_name,
       table_schema,
       table_name
FROM information_schema.tables
WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
  AND table_name LIKE '%local_prequran_teacher_profile'
ORDER BY table_schema, table_name;

SELECT 'teacher_request_table_candidates' AS check_name,
       table_schema,
       table_name
FROM information_schema.tables
WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
  AND table_name LIKE '%local_prequran_teacher_request'
ORDER BY table_schema, table_name;

SELECT 'teacher_marketplace_request_table' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END AS status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_teacher_request';

SELECT 'teacher_profile_marketplace_columns' AS check_name,
       COUNT(*) AS present_columns
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_teacher_profile'
  AND column_name IN (
      'marketplace_visible',
      'marketplace_status',
      'marketplace_bio',
      'marketplace_skills',
      'marketplace_experience',
      'marketplace_education',
      'marketplace_teaching_style',
      'marketplace_courses',
      'vetting_status',
      'vetting_summary',
      'vetting_reviewedby',
      'vetting_reviewedat'
  );

SELECT 'published_teacher_profiles_query' AS check_name,
       CASE
         WHEN profile_table.table_name IS NULL THEN 'SKIPPED: teacher profile table is missing or the mdlgx_ prefix is wrong'
         WHEN profile_columns.present_columns < 12 THEN CONCAT('SKIPPED: missing marketplace columns, found ', profile_columns.present_columns, ' of 12')
         ELSE 'READY: run the optional profile sample query after confirming the table prefix'
       END AS status
FROM (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name LIKE '%local_prequran_teacher_profile'
) profile_table
RIGHT JOIN (
    SELECT COUNT(*) AS present_columns
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name LIKE '%local_prequran_teacher_profile'
      AND column_name IN (
          'marketplace_visible',
          'marketplace_status',
          'marketplace_bio',
          'marketplace_skills',
          'marketplace_experience',
          'marketplace_education',
          'marketplace_teaching_style',
          'marketplace_courses',
          'vetting_status',
          'vetting_summary',
          'vetting_reviewedby',
          'vetting_reviewedat'
      )
) profile_columns ON 1 = 1;

SELECT 'teacher_requests_query' AS check_name,
       CASE
         WHEN COUNT(*) = 1 THEN 'READY: run the optional request sample query after confirming the table prefix'
         ELSE 'SKIPPED: teacher request table is missing or the mdlgx_ prefix is wrong'
       END AS status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_teacher_request';

-- Optional sample query after the table prefix is confirmed:
-- SELECT tp.userid,
--        tp.teacher_display_name,
--        tp.marketplace_visible,
--        tp.marketplace_status,
--        tp.vetting_status,
--        tp.status AS teacher_status
-- FROM mdlgx_local_prequran_teacher_profile tp
-- WHERE tp.marketplace_visible = 1
--    OR tp.marketplace_status <> 'draft'
--    OR tp.vetting_status <> 'not_reviewed'
-- ORDER BY tp.timemodified DESC
-- LIMIT 50;
--
-- SELECT tr.id,
--        tr.teacherid,
--        tr.parentid,
--        tr.studentid,
--        tr.request_status,
--        tr.threadid,
--        tr.timecreated
-- FROM mdlgx_local_prequran_teacher_request tr
-- ORDER BY tr.timecreated DESC
-- LIMIT 50;
