-- READ-ONLY. Helps judge whether the 638 remaining "student" accounts are
-- genuine real enrollment, or whether some are leftover test/e2e debris that
-- didn't match the pilot/qa/test-domain signals from the earlier cleanup
-- (e.g. accounts created by the Playwright e2e suite with realistic-looking
-- names). Nothing here deletes or changes anything.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. How many active students does each real workspace/school actually have?
--    Wildly high counts on a school you know is small, or unfamiliar
--    workspace names, are the tell.
SELECT
    w.name AS workspace_name,
    w.status AS workspace_status,
    COUNT(DISTINCT wm.userid) AS student_count
FROM mdlgx_local_prequran_workspace_member wm
JOIN mdlgx_local_prequran_workspace w ON w.id = wm.workspaceid
JOIN mdlgx_user u ON u.id = wm.userid
WHERE wm.status = 'active'
  AND wm.workspace_role = 'student'
  AND u.deleted = 0
GROUP BY w.id, w.name, w.status
ORDER BY student_count DESC;

-- 2. Creation-date clustering. A handful of dates with dozens/hundreds of
--    students created within the same minute or hour is the classic
--    signature of a bulk script or repeated automated test runs -- real
--    families signing up one at a time would not look like this.
SELECT
    FROM_UNIXTIME(u.timecreated, '%Y-%m-%d %H:00') AS created_hour,
    COUNT(*) AS students_created
FROM mdlgx_local_prequran_workspace_member wm
JOIN mdlgx_user u ON u.id = wm.userid
WHERE wm.status = 'active'
  AND wm.workspace_role = 'student'
  AND u.deleted = 0
GROUP BY created_hour
ORDER BY students_created DESC
LIMIT 30;

-- 3. How many of the remaining students still have a real email vs. the
--    platform's own placeholder domain (@eduplatform.local)? A very high
--    placeholder ratio isn't inherently wrong (young children legitimately
--    get placeholders), but combined with #1/#2 above it helps complete the
--    picture.
SELECT
    CASE WHEN u.email LIKE '%@eduplatform.local' THEN 'placeholder (@eduplatform.local)' ELSE 'real email' END AS email_type,
    COUNT(DISTINCT u.id) AS student_count
FROM mdlgx_local_prequran_workspace_member wm
JOIN mdlgx_user u ON u.id = wm.userid
WHERE wm.status = 'active'
  AND wm.workspace_role = 'student'
  AND u.deleted = 0
GROUP BY email_type;
