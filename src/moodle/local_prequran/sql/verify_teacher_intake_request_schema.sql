-- Verify the public teacher intake request foundation after local_prequran reaches 202606290006.
-- This is read-only. Replace mdlgx_ in optional queries if your Moodle prefix is different.

SELECT 'current_selected_database' AS check_name, DATABASE() AS value;

SELECT 'local_prequran_version' AS check_name, value
FROM mdlgx_config_plugins
WHERE plugin = 'local_prequran'
  AND name = 'version';

SELECT 'teacher_intake_request_table' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_teacher_intake_request';

SELECT 'teacher_intake_request_required_columns' AS check_name,
       COUNT(*) AS present_columns,
       CASE WHEN COUNT(*) >= 40 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_teacher_intake_request'
  AND column_name IN (
      'id',
      'consumerid',
      'workspaceid',
      'teacher_name',
      'email',
      'phone',
      'country',
      'city',
      'timezone',
      'primary_language',
      'other_languages',
      'courses',
      'levels',
      'teacher_work_models',
      'service_modes',
      'subject_language',
      'subject_areas',
      'subject_other',
      'age_groups',
      'general_levels',
      'workspace_preferences',
      'years_experience',
      'institution_experience',
      'application_json',
      'experience',
      'education',
      'teaching_style',
      'bio',
      'availability_json',
      'availability_summary',
      'desired_services',
      'notes',
      'status',
      'converted_userid',
      'converted_profileid',
      'admin_notes',
      'reviewedby',
      'reviewedat',
      'timecreated',
      'timemodified'
  );

-- Optional sample rows after submissions exist:
--
-- SELECT r.id,
--        c.slug AS consumer_slug,
--        r.teacher_name,
--        r.email,
--        r.status,
--        FROM_UNIXTIME(r.timecreated) AS submitted_at
-- FROM mdlgx_local_prequran_teacher_intake_request r
-- LEFT JOIN mdlgx_local_prequran_consumer c ON c.id = r.consumerid
-- ORDER BY r.id DESC
-- LIMIT 25;
