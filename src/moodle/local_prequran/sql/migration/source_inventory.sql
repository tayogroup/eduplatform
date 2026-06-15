-- Source inventory for quraantest on hosting.com.
-- Run against the source Moodle database.
-- Replace mdlgx_ if the source database prefix is different.
-- This script is read-only.

SELECT 'moodle_version' AS item, value
FROM mdlgx_config
WHERE name = 'version';

SELECT 'moodle_release' AS item, value
FROM mdlgx_config
WHERE name = 'release';

SELECT 'site_fullname' AS item, fullname AS value
FROM mdlgx_course
WHERE id = 1;

SELECT 'wwwroot_from_config_table_if_present' AS item, value
FROM mdlgx_config
WHERE name = 'wwwroot';

SELECT plugin, name, value
FROM mdlgx_config_plugins
WHERE plugin IN ('local_prequran', 'local_ehelhome', 'webservice', 'moodle')
   OR plugin LIKE 'auth_%'
   OR plugin LIKE 'enrol_%'
ORDER BY plugin, name;

SELECT plugin, name, value
FROM mdlgx_config_plugins
WHERE name IN ('version', 'release')
ORDER BY plugin, name;

SELECT 'users_total' AS item, COUNT(*) AS row_count FROM mdlgx_user
UNION ALL SELECT 'users_active', COUNT(*) FROM mdlgx_user WHERE deleted = 0 AND suspended = 0
UNION ALL SELECT 'courses_total', COUNT(*) FROM mdlgx_course
UNION ALL SELECT 'course_categories_total', COUNT(*) FROM mdlgx_course_categories
UNION ALL SELECT 'cohorts_total', COUNT(*) FROM mdlgx_cohort
UNION ALL SELECT 'cohort_members_total', COUNT(*) FROM mdlgx_cohort_members
UNION ALL SELECT 'enrol_instances_total', COUNT(*) FROM mdlgx_enrol
UNION ALL SELECT 'user_enrolments_total', COUNT(*) FROM mdlgx_user_enrolments
UNION ALL SELECT 'roles_total', COUNT(*) FROM mdlgx_role
UNION ALL SELECT 'role_assignments_total', COUNT(*) FROM mdlgx_role_assignments
UNION ALL SELECT 'external_services_total', COUNT(*) FROM mdlgx_external_services
UNION ALL SELECT 'external_tokens_total', COUNT(*) FROM mdlgx_external_tokens;

SELECT id, shortname, fullname, visible, category, startdate, enddate
FROM mdlgx_course
ORDER BY id;

SELECT id, name, idnumber, description
FROM mdlgx_cohort
ORDER BY id;

SELECT id, shortname, name, archetype
FROM mdlgx_role
ORDER BY sortorder, id;

SELECT id, name, shortname, enabled, restrictedusers, downloadfiles, uploadfiles
FROM mdlgx_external_services
ORDER BY id;

SELECT s.shortname AS service_shortname, f.name AS function_name
FROM mdlgx_external_services s
JOIN mdlgx_external_services_functions f ON f.externalserviceid = s.id
ORDER BY s.shortname, f.name;

SELECT t.id, t.userid, t.externalserviceid, s.shortname AS service_shortname, t.validuntil, t.iprestriction
FROM mdlgx_external_tokens t
LEFT JOIN mdlgx_external_services s ON s.id = t.externalserviceid
ORDER BY t.externalserviceid, t.userid, t.id;

SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE 'mdlgx_local_prequran%'
ORDER BY table_name;

SELECT table_name, column_name, ordinal_position, column_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name LIKE 'mdlgx_local_prequran%'
ORDER BY table_name, ordinal_position;

