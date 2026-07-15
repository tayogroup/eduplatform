-- Phase 2 verification for workspace finance policy settings.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- Replace :workspaceid with the workspace being verified.

SELECT expected.table_name,
       CASE WHEN actual.TABLE_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS table_status
FROM (
    SELECT 'mdlgx_local_prequran_finance_policy' AS table_name
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name;

SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'consumerid' AS column_name
    UNION ALL SELECT 'workspaceid'
    UNION ALL SELECT 'policyversion'
    UNION ALL SELECT 'policyhash'
    UNION ALL SELECT 'policyjson'
    UNION ALL SELECT 'status'
    UNION ALL SELECT 'createdby'
    UNION ALL SELECT 'modifiedby'
    UNION ALL SELECT 'timecreated'
    UNION ALL SELECT 'timemodified'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_finance_policy'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

SELECT
    fp.id,
    fp.consumerid,
    fp.workspaceid,
    fp.policyversion,
    fp.policyhash,
    fp.status,
    fp.createdby,
    fp.modifiedby,
    fp.timecreated,
    fp.timemodified
FROM mdlgx_local_prequran_finance_policy fp
WHERE fp.workspaceid = :workspaceid
ORDER BY fp.timemodified DESC;

SELECT
    fp.workspaceid,
    fp.policyjson
FROM mdlgx_local_prequran_finance_policy fp
WHERE fp.workspaceid = :workspaceid
  AND fp.status = 'active';

SELECT
    ca.workspaceid,
    ca.eventname,
    ca.targetid,
    ca.summaryjson,
    ca.timecreated
FROM mdlgx_local_prequran_course_audit ca
WHERE ca.workspaceid = :workspaceid
  AND ca.eventname = 'finance_policy_saved'
ORDER BY ca.timecreated DESC;

SELECT
    COUNT(*) AS duplicate_active_policy_count
FROM mdlgx_local_prequran_finance_policy fp
WHERE fp.workspaceid = :workspaceid
  AND fp.status = 'active';
