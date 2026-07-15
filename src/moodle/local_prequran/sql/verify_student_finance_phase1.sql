-- Student finance Phase 1 verification.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Required student finance tables.
SELECT expected.table_name,
       CASE WHEN actual.TABLE_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS table_status
FROM (
    SELECT 'mdlgx_local_prequran_billing_account' AS table_name
    UNION ALL SELECT 'mdlgx_local_prequran_student_finance'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
ORDER BY expected.table_name;

-- 2) Required billing account fields.
SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'consumerid' AS column_name
    UNION ALL SELECT 'workspaceid'
    UNION ALL SELECT 'accounttype'
    UNION ALL SELECT 'primaryuserid'
    UNION ALL SELECT 'displayname'
    UNION ALL SELECT 'billingemail'
    UNION ALL SELECT 'billingphone'
    UNION ALL SELECT 'currency'
    UNION ALL SELECT 'status'
    UNION ALL SELECT 'metadatajson'
    UNION ALL SELECT 'createdby'
    UNION ALL SELECT 'timecreated'
    UNION ALL SELECT 'timemodified'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_billing_account'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

-- 3) Required student finance fields.
SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'consumerid' AS column_name
    UNION ALL SELECT 'workspaceid'
    UNION ALL SELECT 'studentid'
    UNION ALL SELECT 'billingaccountid'
    UNION ALL SELECT 'financepolicyjson'
    UNION ALL SELECT 'holdstatus'
    UNION ALL SELECT 'status'
    UNION ALL SELECT 'createdby'
    UNION ALL SELECT 'timecreated'
    UNION ALL SELECT 'timemodified'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_student_finance'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

-- 4) Student finance profiles with billing account scope.
SELECT sf.id AS studentfinanceid,
       sf.consumerid AS finance_consumerid,
       sf.workspaceid AS finance_workspaceid,
       sf.studentid,
       u.firstname,
       u.lastname,
       u.email,
       sf.billingaccountid,
       ba.consumerid AS account_consumerid,
       ba.workspaceid AS account_workspaceid,
       ba.accounttype,
       ba.displayname,
       ba.billingemail,
       ba.currency,
       ba.status AS account_status,
       sf.holdstatus,
       CASE
           WHEN ba.id IS NULL THEN 'MISSING_ACCOUNT'
           WHEN ba.workspaceid <> sf.workspaceid THEN 'CROSS_WORKSPACE'
           WHEN ba.consumerid <> sf.consumerid THEN 'CONSUMER_MISMATCH'
           ELSE 'OK'
       END AS scope_status
FROM mdlgx_local_prequran_student_finance sf
LEFT JOIN mdlgx_local_prequran_billing_account ba
       ON ba.id = sf.billingaccountid
LEFT JOIN mdlgx_user u
       ON u.id = sf.studentid
ORDER BY sf.timemodified DESC, sf.id DESC
LIMIT 100;

-- 5) Active students without a student finance profile.
SELECT wm.workspaceid,
       wm.userid AS studentid,
       u.firstname,
       u.lastname,
       u.email
FROM mdlgx_local_prequran_workspace_member wm
JOIN mdlgx_user u
  ON u.id = wm.userid
LEFT JOIN mdlgx_local_prequran_student_finance sf
       ON sf.workspaceid = wm.workspaceid
      AND sf.studentid = wm.userid
      AND sf.status = 'active'
WHERE wm.workspace_role = 'student'
  AND wm.status = 'active'
  AND sf.id IS NULL
ORDER BY wm.workspaceid ASC, u.lastname ASC, u.firstname ASC
LIMIT 100;
