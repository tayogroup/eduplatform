-- READ-ONLY identification pass. Nothing here deletes or changes anything --
-- run this first and review the results before any deletion script is
-- written. Goal: surface every account that looks like a test/pilot/QA
-- account, broken down by their workspace role, so "delete test/pilot
-- students and teachers, keep every other role" can be applied precisely
-- instead of guessing.
--
-- Signals checked (a account can match more than one):
--   1. Username contains 'pilot' or starts with 'qa-'
--   2. Email domain is a known TEST-ONLY domain (example.com / *.example.com)
--      -- NOTE: deliberately does NOT include @eduplatform.local. That domain
--      is the platform's own placeholder for ANY real account without a real
--      email (most young students, phone-only parents/teachers) -- it is not
--      a test-account marker and including it would flag real people.
--   3. Formally tagged with the platform's own 'sqa_tester' Moodle role
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Every user matching any test/pilot signal, with their current role(s)
--    across all workspaces (a person can be in more than one workspace).
SELECT
    u.id AS userid,
    u.username,
    u.email,
    u.idnumber AS account_no,
    CONCAT(u.firstname, ' ', u.lastname) AS full_name,
    u.deleted,
    u.suspended,
    GROUP_CONCAT(DISTINCT wm.workspace_role ORDER BY wm.workspace_role SEPARATOR ', ') AS workspace_roles,
    GROUP_CONCAT(DISTINCT w.name ORDER BY w.name SEPARATOR ' | ') AS workspaces,
    CASE WHEN EXISTS (
        SELECT 1
          FROM mdlgx_role_assignments ra
          JOIN mdlgx_role r ON r.id = ra.roleid
         WHERE ra.userid = u.id AND r.shortname = 'sqa_tester'
    ) THEN 1 ELSE 0 END AS is_tagged_sqa_tester
FROM mdlgx_user u
LEFT JOIN mdlgx_local_prequran_workspace_member wm ON wm.userid = u.id AND wm.status = 'active'
LEFT JOIN mdlgx_local_prequran_workspace w ON w.id = wm.workspaceid
WHERE u.deleted = 0
  AND (
        u.username LIKE '%pilot%'
     OR u.username LIKE 'qa-%'
     OR u.email LIKE '%@ehel.example.com'
     OR u.email LIKE '%@example.com'
     OR EXISTS (
         SELECT 1
           FROM mdlgx_role_assignments ra
           JOIN mdlgx_role r ON r.id = ra.roleid
          WHERE ra.userid = u.id AND r.shortname = 'sqa_tester'
     )
  )
GROUP BY u.id, u.username, u.email, u.idnumber, u.firstname, u.lastname, u.deleted, u.suspended
ORDER BY workspace_roles ASC, u.username ASC;

-- 2. Summary: how many matched accounts fall into each role bucket, so you
--    can sanity-check the scale before anything is deleted.
SELECT
    COALESCE(wm.workspace_role, '(no active workspace membership)') AS workspace_role,
    COUNT(DISTINCT u.id) AS matched_account_count
FROM mdlgx_user u
LEFT JOIN mdlgx_local_prequran_workspace_member wm ON wm.userid = u.id AND wm.status = 'active'
WHERE u.deleted = 0
  AND (
        u.username LIKE '%pilot%'
     OR u.username LIKE 'qa-%'
     OR u.email LIKE '%@ehel.example.com'
     OR u.email LIKE '%@example.com'
     OR EXISTS (
         SELECT 1
           FROM mdlgx_role_assignments ra
           JOIN mdlgx_role r ON r.id = ra.roleid
          WHERE ra.userid = u.id AND r.shortname = 'sqa_tester'
     )
  )
GROUP BY wm.workspace_role
ORDER BY matched_account_count DESC;
