-- Verify the organization-group foundation for owned school groups and franchise networks.
-- This is read-only and prefix-agnostic for phpMyAdmin use.

SELECT 'current_selected_database' AS check_name,
       DATABASE() AS value;

SELECT 'org_group_table' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_org_group';

SELECT 'org_group_member_table' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_org_group_member';

SELECT 'org_group_required_columns' AS check_name,
       COUNT(*) AS present_columns,
       CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_org_group'
  AND column_name IN (
      'slug',
      'name',
      'group_type',
      'parentconsumerid',
      'status',
      'policyjson',
      'createdby',
      'timecreated',
      'timemodified',
      'id'
  );

SELECT 'org_group_member_required_columns' AS check_name,
       COUNT(*) AS present_columns,
       CASE WHEN COUNT(*) >= 13 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_org_group_member'
  AND column_name IN (
      'id',
      'groupid',
      'member_type',
      'memberid',
      'relationship_type',
      'group_role',
      'access_scope',
      'inherit_sensitive_access',
      'status',
      'notes',
      'createdby',
      'timecreated',
      'timemodified'
  );

SELECT 'organization_group_tables' AS check_name,
       table_schema,
       table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE '%local_prequran_org_group%'
ORDER BY table_name;

-- Optional linked-data inspection after the table checks pass. Replace mdlgx_
-- with the real prefix shown above if your site uses another table prefix.
--
-- SELECT 'organization_groups' AS check_name,
--        id,
--        slug,
--        name,
--        group_type,
--        parentconsumerid,
--        status
-- FROM mdlgx_local_prequran_org_group
-- ORDER BY name;
--
-- SELECT 'organization_group_members' AS check_name,
--        g.slug AS group_slug,
--        gm.member_type,
--        gm.memberid,
--        gm.relationship_type,
--        gm.group_role,
--        gm.access_scope,
--        gm.inherit_sensitive_access,
--        gm.status
-- FROM mdlgx_local_prequran_org_group_member gm
-- JOIN mdlgx_local_prequran_org_group g ON g.id = gm.groupid
-- ORDER BY g.slug, gm.member_type, gm.memberid;
