-- Verify the consumer-scoping upgrade after local_prequran reaches 202606290005.
-- This is read-only and prefix-agnostic for phpMyAdmin use.

SELECT 'current_selected_database' AS check_name, DATABASE() AS value;

SELECT 'local_prequran_version' AS check_name, value
FROM mdlgx_config_plugins
WHERE plugin = 'local_prequran'
  AND name = 'version';

SELECT 'intake_request_consumerid' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_intake_request'
  AND column_name = 'consumerid';

SELECT 'teacher_profile_consumerid' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_teacher_profile'
  AND column_name = 'consumerid';

SELECT 'teacher_request_consumerid' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_teacher_request'
  AND column_name = 'consumerid';

-- Optional seeded/backfill check after the column checks pass.
-- Replace mdlgx_ if your Moodle prefix is different.
--
-- SELECT 'intake_request_consumer_counts' AS check_name,
--        c.slug,
--        COUNT(*) AS row_count
-- FROM mdlgx_local_prequran_intake_request r
-- LEFT JOIN mdlgx_local_prequran_consumer c ON c.id = r.consumerid
-- GROUP BY c.slug
-- ORDER BY c.slug;
--
-- SELECT 'teacher_profile_consumer_counts' AS check_name,
--        c.slug,
--        COUNT(*) AS row_count
-- FROM mdlgx_local_prequran_teacher_profile p
-- LEFT JOIN mdlgx_local_prequran_consumer c ON c.id = p.consumerid
-- GROUP BY c.slug
-- ORDER BY c.slug;
