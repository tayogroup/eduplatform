-- Student grouping verification.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Required grouping tables.
SELECT expected.table_name,
       CASE WHEN actual.TABLE_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS table_status
FROM (
    SELECT 'mdlgx_local_prequran_student_profile' AS table_name
    UNION ALL SELECT 'mdlgx_local_prequran_group_pool'
    UNION ALL SELECT 'mdlgx_local_prequran_class_group'
    UNION ALL SELECT 'mdlgx_local_prequran_group_member'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
ORDER BY expected.table_name;

-- 2) Required student profile fields.
SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'userid' AS column_name
    UNION ALL SELECT 'student_display_name'
    UNION ALL SELECT 'date_of_birth'
    UNION ALL SELECT 'timezone'
    UNION ALL SELECT 'primary_language'
    UNION ALL SELECT 'language'
    UNION ALL SELECT 'age_years'
    UNION ALL SELECT 'age_band'
    UNION ALL SELECT 'current_level'
    UNION ALL SELECT 'learning_base'
    UNION ALL SELECT 'country'
    UNION ALL SELECT 'city'
    UNION ALL SELECT 'gender'
    UNION ALL SELECT 'parent_name'
    UNION ALL SELECT 'parent_email'
    UNION ALL SELECT 'parent_phone'
    UNION ALL SELECT 'live_class_consent'
    UNION ALL SELECT 'recording_consent'
    UNION ALL SELECT 'consent_notes'
    UNION ALL SELECT 'availability'
    UNION ALL SELECT 'parent_preferences'
    UNION ALL SELECT 'status'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_student_profile'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

-- 3) Required class group fields.
SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'poolid' AS column_name
    UNION ALL SELECT 'teacherid'
    UNION ALL SELECT 'title'
    UNION ALL SELECT 'timezone'
    UNION ALL SELECT 'language'
    UNION ALL SELECT 'current_level'
    UNION ALL SELECT 'learning_base'
    UNION ALL SELECT 'country'
    UNION ALL SELECT 'city'
    UNION ALL SELECT 'age_min'
    UNION ALL SELECT 'age_max'
    UNION ALL SELECT 'gender_policy'
    UNION ALL SELECT 'schedule_summary'
    UNION ALL SELECT 'max_students'
    UNION ALL SELECT 'status'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_class_group'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

-- 4) Required live-session and series group links.
SELECT expected.table_name,
       expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'mdlgx_local_prequran_live_session' AS table_name, 'groupid' AS column_name
    UNION ALL SELECT 'mdlgx_local_prequran_live_series', 'groupid'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.table_name;

-- 5) Grouping counts.
SELECT 'student_profiles' AS metric, COUNT(*) AS value FROM mdlgx_local_prequran_student_profile
UNION ALL SELECT 'matching_pools', COUNT(*) FROM mdlgx_local_prequran_group_pool
UNION ALL SELECT 'class_groups', COUNT(*) FROM mdlgx_local_prequran_class_group
UNION ALL SELECT 'group_memberships', COUNT(*) FROM mdlgx_local_prequran_group_member
UNION ALL SELECT 'missing_live_class_consent', COUNT(*) FROM mdlgx_local_prequran_student_profile WHERE live_class_consent = 0
UNION ALL SELECT 'missing_parent_email', COUNT(*) FROM mdlgx_local_prequran_student_profile WHERE parent_email = ''
UNION ALL SELECT 'ungrouped_active_profiles', COUNT(*)
FROM mdlgx_local_prequran_student_profile sp
WHERE sp.status = 'active'
  AND NOT EXISTS (
      SELECT 1
      FROM mdlgx_local_prequran_group_member gm
      WHERE gm.studentid = sp.userid
        AND gm.assignment_status = 'active'
  );

-- 6) Current group capacity.
SELECT g.id AS groupid,
       g.title,
       g.teacherid,
       g.timezone,
       g.language,
       g.current_level,
       g.learning_base,
       g.country,
       g.city,
       g.gender_policy,
       g.max_students,
       COUNT(gm.id) AS active_students,
       CASE
           WHEN COUNT(gm.id) >= g.max_students THEN 'FULL'
           WHEN COUNT(gm.id) >= GREATEST(1, g.max_students - 2) THEN 'NEAR_FULL'
           ELSE 'OPEN'
       END AS capacity_status
FROM mdlgx_local_prequran_class_group g
LEFT JOIN mdlgx_local_prequran_group_member gm
       ON gm.groupid = g.id
      AND gm.assignment_status = 'active'
GROUP BY g.id, g.title, g.teacherid, g.timezone, g.language, g.current_level,
         g.learning_base, g.country, g.city, g.gender_policy, g.max_students
ORDER BY g.title ASC
LIMIT 100;
