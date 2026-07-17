-- Somali University: link demo records to the EduPlatform workspace
-- Run AFTER demo-data.sql. MySQL/MariaDB. Prefix from DB_PREFIX (mdlgx_).
--
-- 1. SET the workspace id below. Yours is in the dashboard URL,
--    e.g. workspace_dashboard.php?...&workspaceid=15  ->  15
-- 2. The consumer id is read from the workspace row automatically.
-- 3. Safe to re-run: inserts skip rows that already exist.
-- 4. Purge caches afterwards so the dashboard counters refresh.

SET @workspaceid := 15;
-- The consumer row points at the workspace via primaryworkspaceid.
-- If this returns NULL (multi-workspace consumer), use the slug lookup
-- on the next line instead.
SET @consumerid := (SELECT id FROM mdlgx_local_prequran_consumer WHERE primaryworkspaceid = @workspaceid LIMIT 1);
-- SET @consumerid := (SELECT id FROM mdlgx_local_prequran_consumer WHERE slug = 'institution-1784275208');

START TRANSACTION;

-- Workspace members: admin, teachers, students -------------------------
INSERT INTO mdlgx_local_prequran_workspace_member (workspaceid, userid, workspace_role, status, timecreated, timemodified)
SELECT @workspaceid, u.id, 'admin', 'active', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdlgx_user u
WHERE u.username = 'su-admin' AND u.deleted = 0
  AND NOT EXISTS (SELECT 1 FROM mdlgx_local_prequran_workspace_member m
                  WHERE m.workspaceid = @workspaceid AND m.userid = u.id);

INSERT INTO mdlgx_local_prequran_workspace_member (workspaceid, userid, workspace_role, status, timecreated, timemodified)
SELECT @workspaceid, u.id, 'teacher', 'active', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdlgx_user u
WHERE u.username LIKE 'su-teacher%' AND u.deleted = 0
  AND NOT EXISTS (SELECT 1 FROM mdlgx_local_prequran_workspace_member m
                  WHERE m.workspaceid = @workspaceid AND m.userid = u.id);

INSERT INTO mdlgx_local_prequran_workspace_member (workspaceid, userid, workspace_role, status, timecreated, timemodified)
SELECT @workspaceid, u.id, 'student', 'active', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdlgx_user u
WHERE u.username LIKE 'su-student%' AND u.deleted = 0
  AND NOT EXISTS (SELECT 1 FROM mdlgx_local_prequran_workspace_member m
                  WHERE m.workspaceid = @workspaceid AND m.userid = u.id);

-- Published course offerings (one per su-* course) ---------------------
INSERT INTO mdlgx_local_prequran_course_offering
  (consumerid, workspaceid, moodlecourseid, course_key, title, summary,
   capacity, tuition_amount, pricing_currency, visibility, approval_mode,
   status, createdby, startdate, enddate, timecreated, timemodified)
SELECT @consumerid, @workspaceid, c.id, 'su-eng101', 'English Foundations',
       'English Foundations - Somali University demo offering. Schedule: Mon/Wed 10:00 AM.',
       240, '0.00', 'USD', 'public', 'admin_approval', 'published', 0,
       UNIX_TIMESTAMP(), UNIX_TIMESTAMP() + (180 * 86400), UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdlgx_course c
WHERE c.shortname = 'su-eng101'
  AND NOT EXISTS (SELECT 1 FROM mdlgx_local_prequran_course_offering o
                  WHERE o.workspaceid = @workspaceid AND o.moodlecourseid = c.id);

INSERT INTO mdlgx_local_prequran_course_offering
  (consumerid, workspaceid, moodlecourseid, course_key, title, summary,
   capacity, tuition_amount, pricing_currency, visibility, approval_mode,
   status, createdby, startdate, enddate, timecreated, timemodified)
SELECT @consumerid, @workspaceid, c.id, 'su-math101', 'Mathematics Foundations',
       'Mathematics Foundations - Somali University demo offering. Schedule: Tue/Thu 8:00 AM.',
       240, '0.00', 'USD', 'public', 'admin_approval', 'published', 0,
       UNIX_TIMESTAMP(), UNIX_TIMESTAMP() + (180 * 86400), UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdlgx_course c
WHERE c.shortname = 'su-math101'
  AND NOT EXISTS (SELECT 1 FROM mdlgx_local_prequran_course_offering o
                  WHERE o.workspaceid = @workspaceid AND o.moodlecourseid = c.id);

INSERT INTO mdlgx_local_prequran_course_offering
  (consumerid, workspaceid, moodlecourseid, course_key, title, summary,
   capacity, tuition_amount, pricing_currency, visibility, approval_mode,
   status, createdby, startdate, enddate, timecreated, timemodified)
SELECT @consumerid, @workspaceid, c.id, 'su-qurn101', 'Quraan Recitation and Tajweed',
       'Quraan Recitation and Tajweed - Somali University demo offering. Schedule: Sat/Sun 4:00 PM.',
       210, '0.00', 'USD', 'public', 'admin_approval', 'published', 0,
       UNIX_TIMESTAMP(), UNIX_TIMESTAMP() + (180 * 86400), UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdlgx_course c
WHERE c.shortname = 'su-qurn101'
  AND NOT EXISTS (SELECT 1 FROM mdlgx_local_prequran_course_offering o
                  WHERE o.workspaceid = @workspaceid AND o.moodlecourseid = c.id);

INSERT INTO mdlgx_local_prequran_course_offering
  (consumerid, workspaceid, moodlecourseid, course_key, title, summary,
   capacity, tuition_amount, pricing_currency, visibility, approval_mode,
   status, createdby, startdate, enddate, timecreated, timemodified)
SELECT @consumerid, @workspaceid, c.id, 'su-arb101', 'Arabic Language Basics',
       'Arabic Language Basics - Somali University demo offering. Schedule: Mon/Thu 2:00 PM.',
       240, '0.00', 'USD', 'public', 'admin_approval', 'published', 0,
       UNIX_TIMESTAMP(), UNIX_TIMESTAMP() + (180 * 86400), UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdlgx_course c
WHERE c.shortname = 'su-arb101'
  AND NOT EXISTS (SELECT 1 FROM mdlgx_local_prequran_course_offering o
                  WHERE o.workspaceid = @workspaceid AND o.moodlecourseid = c.id);

INSERT INTO mdlgx_local_prequran_course_offering
  (consumerid, workspaceid, moodlecourseid, course_key, title, summary,
   capacity, tuition_amount, pricing_currency, visibility, approval_mode,
   status, createdby, startdate, enddate, timecreated, timemodified)
SELECT @consumerid, @workspaceid, c.id, 'su-isl101', 'Islamic Studies Foundations',
       'Islamic Studies Foundations - Somali University demo offering. Schedule: Tue/Sat 6:00 PM.',
       270, '0.00', 'USD', 'public', 'admin_approval', 'published', 0,
       UNIX_TIMESTAMP(), UNIX_TIMESTAMP() + (180 * 86400), UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdlgx_course c
WHERE c.shortname = 'su-isl101'
  AND NOT EXISTS (SELECT 1 FROM mdlgx_local_prequran_course_offering o
                  WHERE o.workspaceid = @workspaceid AND o.moodlecourseid = c.id);

COMMIT;

-- If an insert fails with "Unknown column", that optional column does
-- not exist in your plugin version - remove it from the column list and
-- its value from the SELECT, then re-run.
--
-- CLEANUP (when the demo is over; uncomment to use)
-- DELETE m FROM mdlgx_local_prequran_workspace_member m JOIN mdlgx_user u ON u.id = m.userid
--   WHERE m.workspaceid = @workspaceid AND u.username LIKE 'su-%';
-- DELETE FROM mdlgx_local_prequran_course_offering
--   WHERE workspaceid = @workspaceid AND course_key LIKE 'su-%';
