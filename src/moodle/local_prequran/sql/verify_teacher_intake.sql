-- Teacher intake verification.
-- Replace mdlgx_ with your Moodle database prefix if needed.

SELECT 'local_prequran_teacher_profile' AS table_name,
       CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END AS table_status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'mdlgx_local_prequran_teacher_profile';

SHOW COLUMNS FROM mdlgx_local_prequran_teacher_profile;

SHOW INDEX FROM mdlgx_local_prequran_teacher_profile
WHERE Key_name IN (
  'mdlgx_preq_teacherprof_user_uix',
  'mdlgx_preq_teacherprof_status_ix',
  'mdlgx_preq_teacherprof_match_ix',
  'mdlgx_preq_teacherprof_createdby_ix'
);

SELECT tp.id AS profileid,
       tp.userid AS teacherid,
       u.username,
       u.firstname,
       u.lastname,
       u.email,
       tp.teacher_display_name,
       tp.gender,
       tp.country,
       tp.city,
       tp.timezone,
       tp.primary_language,
       tp.courses_taught,
       tp.levels_taught,
       tp.max_students_per_class,
       tp.max_weekly_hours,
       tp.status,
       FROM_UNIXTIME(tp.timemodified) AS timemodified
FROM mdlgx_local_prequran_teacher_profile tp
JOIN mdlgx_user u ON u.id = tp.userid
ORDER BY tp.id DESC
LIMIT 25;

SELECT a.teacherid,
       tp.teacher_display_name,
       a.weekday,
       a.start_minute,
       a.end_minute,
       a.timezone,
       a.status,
       FROM_UNIXTIME(a.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_availability a
LEFT JOIN mdlgx_local_prequran_teacher_profile tp ON tp.userid = a.teacherid
ORDER BY a.id DESC
LIMIT 50;

SELECT id,
       actorid,
       action,
       targettype,
       targetid,
       details,
       FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN ('teacher_intake_created', 'teacher_intake_updated')
ORDER BY id DESC
LIMIT 50;
