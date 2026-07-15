-- Verify the multi-consumer/domain foundation after the Moodle upgrade runs.
-- This is read-only. It is intentionally prefix-agnostic for phpMyAdmin use.

SELECT 'current_selected_database' AS check_name,
       DATABASE() AS value;

SELECT 'consumer_table' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_consumer';

SELECT 'consumer_domain_table' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_consumer_domain';

SELECT 'consumer_required_columns' AS check_name,
       COUNT(*) AS present_columns,
       CASE WHEN COUNT(*) >= 29 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_consumer'
  AND column_name IN (
      'slug',
      'name',
      'consumer_type',
      'institution_type',
      'faith_subcategory',
      'teaching_method',
      'operator_type',
      'website_mode',
      'externalwebsiteurl',
      'domainmanagement',
      'portallabel',
      'brandingsource',
      'intakelocation',
      'integrationmethod',
      'returnurl',
      'status',
      'primaryworkspaceid',
      'owneruserid',
      'supportemail',
      'logourl',
      'themejson',
      'copyjson',
      'defaultpublicpath',
      'defaultdashboardpath',
      'emailfromname',
      'emailreplyto',
      'createdby',
      'timecreated',
      'timemodified'
  );

SELECT 'consumer_domain_required_columns' AS check_name,
       COUNT(*) AS present_columns,
       CASE WHEN COUNT(*) >= 12 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_consumer_domain'
  AND column_name IN (
      'consumerid',
      'workspaceid',
      'domain',
      'domain_type',
      'isprimary',
      'sslstatus',
      'verificationstatus',
      'verifiedat',
      'status',
      'createdby',
      'timecreated',
      'timemodified'
  );

SELECT 'consumer_table_candidates' AS check_name,
       table_schema,
       table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_consumer'
ORDER BY table_name;

SELECT 'consumer_domain_table_candidates' AS check_name,
       table_schema,
       table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_consumer_domain'
ORDER BY table_name;

-- Optional seeded-data checks after the table checks above pass.
-- If these table names fail, replace mdlgx_ with the real prefix shown by the
-- candidate queries above.
--
-- SELECT 'seeded_consumers' AS check_name,
--        c.slug,
--        c.name,
--        c.consumer_type,
--        c.status,
--        c.primaryworkspaceid
-- FROM mdlgx_local_prequran_consumer c
-- WHERE c.slug IN ('quraan-academy', 'edu-for-tomorrow')
-- ORDER BY c.slug;
--
-- SELECT 'seeded_domains' AS check_name,
--        c.slug AS consumer_slug,
--        d.domain,
--        d.domain_type,
--        d.isprimary,
--        d.status,
--        d.verificationstatus
-- FROM mdlgx_local_prequran_consumer_domain d
-- JOIN mdlgx_local_prequran_consumer c ON c.id = d.consumerid
-- WHERE d.domain IN (
--     'quraantest.academy',
--     'quraan.academy',
--     'edufortomorrow.com',
--     'www.edufortomorrow.com',
--     'app.edufortomorrow.com'
-- )
-- ORDER BY c.slug, d.isprimary DESC, d.domain;
