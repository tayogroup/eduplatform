-- Pre-Quraan Moodle environment readiness check.
-- Replace mdlgx_ with your Moodle table prefix before running.

SELECT
    'environment_columns' AS check_name,
    c.TABLE_NAME AS table_name,
    c.COLUMN_NAME AS column_name,
    c.COLUMN_DEFAULT AS default_value
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.TABLE_SCHEMA = DATABASE()
  AND c.TABLE_NAME IN (
      'mdlgx_local_prequran_lessonprog',
      'mdlgx_local_prequran_stepprog',
      'mdlgx_local_prequran_stepcfg',
      'mdlgx_local_prequran_focuslog',
      'mdlgx_local_prequran_focusagg',
      'mdlgx_local_prequran_speakrec',
      'mdlgx_local_prequran_submitrec'
  )
  AND c.COLUMN_NAME = 'environment'
ORDER BY c.TABLE_NAME;

SELECT
    'environment_config' AS check_name,
    name,
    value
FROM mdlgx_config_plugins
WHERE plugin = 'local_prequran'
  AND name IN (
      'bunny_environment',
      'bunny_base_production',
      'bunny_base_staging',
      'bunny_base_integration',
      'allow_nonproduction_launch'
  )
ORDER BY name;

SELECT 'lessonprog_by_environment' AS check_name, environment, COUNT(*) AS rows_count
FROM mdlgx_local_prequran_lessonprog
GROUP BY environment
ORDER BY environment;

SELECT 'stepprog_by_environment' AS check_name, environment, COUNT(*) AS rows_count
FROM mdlgx_local_prequran_stepprog
GROUP BY environment
ORDER BY environment;

SELECT 'stepcfg_by_environment' AS check_name, environment, lessonid, unitid, COUNT(*) AS active_steps
FROM mdlgx_local_prequran_stepcfg
WHERE active = 1
GROUP BY environment, lessonid, unitid
ORDER BY environment, lessonid, unitid;

SELECT 'recordings_by_environment' AS check_name, 'speakrec' AS source_table, environment, COUNT(*) AS rows_count
FROM mdlgx_local_prequran_speakrec
GROUP BY environment
UNION ALL
SELECT 'recordings_by_environment' AS check_name, 'submitrec' AS source_table, environment, COUNT(*) AS rows_count
FROM mdlgx_local_prequran_submitrec
GROUP BY environment
ORDER BY source_table, environment;
