-- READ-ONLY. Checks for leftover debris the account/course cleanups didn't
-- reach: orphaned workspaces (admin deleted but the workspace/consumer
-- record itself wasn't), empty test-run course categories, and pending
-- intake-queue rows that never became real accounts.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Workspaces with ZERO active members left at all -- these lost their
--    admin in the "delete all except keep list" pass, but the
--    workspace/consumer/domain records themselves were never touched (that
--    tool only deleted accounts, not workspace data).
SELECT
    w.id AS workspaceid,
    w.name,
    w.slug,
    w.status,
    c.id AS consumerid,
    c.name AS consumer_name,
    (SELECT COUNT(*) FROM mdlgx_local_prequran_workspace_member wm WHERE wm.workspaceid = w.id AND wm.status = 'active') AS active_members
FROM mdlgx_local_prequran_workspace w
LEFT JOIN mdlgx_local_prequran_consumer c ON c.primaryworkspaceid = w.id
HAVING active_members = 0
ORDER BY w.id ASC;

-- 2. Course categories that now have zero courses left in them (mostly the
--    per-test-run "SQA Academic pre_quraan academic-content-<timestamp>"
--    style categories created fresh by each automated test run).
SELECT
    cc.id AS categoryid,
    cc.name,
    cc.visible,
    (SELECT COUNT(*) FROM mdlgx_course c WHERE c.category = cc.id) AS course_count
FROM mdlgx_course_categories cc
HAVING course_count = 0
ORDER BY cc.id ASC;

-- 3. Pending intake requests (student side) that never converted into a
--    real account -- these reference test names/emails but aren't tied to
--    any user id, so the account cleanups never touched them.
SELECT COUNT(*) AS pending_student_intake_requests
FROM mdlgx_local_prequran_intake_request
WHERE status IN ('pending', 'contacted');

-- 4. Same for teacher-side intake applications.
SELECT COUNT(*) AS pending_teacher_intake_requests
FROM mdlgx_local_prequran_teacher_intake_request
WHERE status IN ('pending', 'reviewing', 'contacted');

-- 5. Referral records (referrers.php) tied to now-deleted referrer accounts.
SELECT COUNT(*) AS referral_rows_with_deleted_referrer
FROM mdlgx_local_prequran_referral r
LEFT JOIN mdlgx_user u ON u.id = r.referrerid AND u.deleted = 0
WHERE u.id IS NULL;
